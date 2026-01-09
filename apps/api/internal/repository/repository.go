package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yourorg/nous/internal/models"
)

type Repository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Ping checks database connectivity
func (r *Repository) Ping(ctx context.Context) error {
	return r.db.Ping(ctx)
}

// IngestToolCall stores a tool call event in the database
func (r *Repository) IngestToolCall(ctx context.Context, event models.ToolCallEvent) error {
	requestID, err := uuid.Parse(event.RequestID)
	if err != nil {
		return fmt.Errorf("invalid request_id: %w", err)
	}

	var createdAt time.Time
	if event.Timestamp != nil {
		createdAt = *event.Timestamp
	} else {
		createdAt = time.Now()
	}

	inputTokens := 0
	if event.InputTokens != nil {
		inputTokens = *event.InputTokens
	}

	outputTokens := 0
	if event.OutputTokens != nil {
		outputTokens = *event.OutputTokens
	}

	query := `
		INSERT INTO tool_calls (
			request_id, tool_name, duration_ms, status,
			input_tokens, output_tokens, error_message, metadata, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	// Handle metadata - convert to JSONB, use empty object if nil
	var metadataJSON interface{}
	if event.Metadata != nil {
		metadataJSON = event.Metadata
	} else {
		metadataJSON = map[string]interface{}{}
	}

	_, err = r.db.Exec(
		ctx, query,
		requestID, event.ToolName, event.DurationMs, event.Status,
		inputTokens, outputTokens, event.ErrorMessage, metadataJSON, createdAt,
	)

	if err != nil {
		return fmt.Errorf("failed to insert tool call: %w", err)
	}

	return nil
}

// GetToolCallsMetrics returns aggregated tool call data grouped by hour
func (r *Repository) GetToolCallsMetrics(ctx context.Context, hours int) ([]models.ToolCallDataPoint, error) {
	// Use TimescaleDB time_bucket if available, otherwise use date_trunc
	query := `
		SELECT 
			TO_CHAR(time_bucket('1 hour', created_at), 'HH24:MI') as hour,
			COUNT(*) FILTER (WHERE status = 'success') as success,
			COUNT(*) FILTER (WHERE status = 'failed') as failures
		FROM tool_calls
		WHERE created_at >= NOW() - make_interval(hours => $1)
		GROUP BY time_bucket('1 hour', created_at)
		ORDER BY hour
	`

	rows, err := r.db.Query(ctx, query, hours)
	if err != nil {
		// Fallback to standard PostgreSQL if TimescaleDB not available
		query = `
			SELECT 
				TO_CHAR(date_trunc('hour', created_at), 'HH24:MI') as hour,
				COUNT(*) FILTER (WHERE status = 'success') as success,
				COUNT(*) FILTER (WHERE status = 'failed') as failures
			FROM tool_calls
			WHERE created_at >= NOW() - make_interval(hours => $1)
			GROUP BY date_trunc('hour', created_at)
			ORDER BY hour
		`
		rows, err = r.db.Query(ctx, query, hours)
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	var results []models.ToolCallDataPoint
	for rows.Next() {
		var dp models.ToolCallDataPoint
		if err := rows.Scan(&dp.Hour, &dp.Success, &dp.Failures); err != nil {
			return nil, err
		}
		results = append(results, dp)
	}

	return results, nil
}

// GetLatencyMetrics returns latency percentiles per tool
func (r *Repository) GetLatencyMetrics(ctx context.Context, hours int) ([]models.LatencyDataPoint, error) {
	query := `
		SELECT 
			tool_name,
			COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms), 0)::float as p50,
			COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::float as p95,
			COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms), 0)::float as p99
		FROM tool_calls
		WHERE created_at >= NOW() - make_interval(hours => $1)
			AND status = 'success'
		GROUP BY tool_name
		HAVING COUNT(*) > 0
		ORDER BY tool_name
	`

	rows, err := r.db.Query(ctx, query, hours)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	var results []models.LatencyDataPoint
	for rows.Next() {
		var dp models.LatencyDataPoint
		if err := rows.Scan(&dp.Tool, &dp.P50, &dp.P95, &dp.P99); err != nil {
			return nil, fmt.Errorf("scan error: %w", err)
		}
		results = append(results, dp)
	}

	return results, nil
}

// GetTokenUsageMetrics returns token usage aggregated by hour
func (r *Repository) GetTokenUsageMetrics(ctx context.Context, hours int) ([]models.TokenUsageDataPoint, error) {
	query := `
		SELECT 
			TO_CHAR(time_bucket('1 hour', created_at), 'HH24:MI') as hour,
			COALESCE(SUM(input_tokens), 0)::int as input,
			COALESCE(SUM(output_tokens), 0)::int as output
		FROM tool_calls
		WHERE created_at >= NOW() - make_interval(hours => $1)
		GROUP BY time_bucket('1 hour', created_at)
		ORDER BY hour
	`

	rows, err := r.db.Query(ctx, query, hours)
	if err != nil {
		// Fallback to standard PostgreSQL
		query = `
			SELECT 
				TO_CHAR(date_trunc('hour', created_at), 'HH24:MI') as hour,
				COALESCE(SUM(input_tokens), 0)::int as input,
				COALESCE(SUM(output_tokens), 0)::int as output
			FROM tool_calls
			WHERE created_at >= NOW() - make_interval(hours => $1)
			GROUP BY date_trunc('hour', created_at)
			ORDER BY hour
		`
		rows, err = r.db.Query(ctx, query, hours)
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	var results []models.TokenUsageDataPoint
	for rows.Next() {
		var dp models.TokenUsageDataPoint
		if err := rows.Scan(&dp.Hour, &dp.Input, &dp.Output); err != nil {
			return nil, err
		}
		results = append(results, dp)
	}

	return results, nil
}

// GetFailureRateMetrics returns failure rate aggregated by hour
func (r *Repository) GetFailureRateMetrics(ctx context.Context, hours int) ([]models.FailureRateDataPoint, error) {
	query := `
		SELECT 
			TO_CHAR(time_bucket('1 hour', created_at), 'HH24:MI') as hour,
			CASE 
				WHEN COUNT(*) > 0 THEN 
					(COUNT(*) FILTER (WHERE status = 'failed')::float / COUNT(*)::float * 100)
				ELSE 0
			END as failure_percent
		FROM tool_calls
		WHERE created_at >= NOW() - make_interval(hours => $1)
		GROUP BY time_bucket('1 hour', created_at)
		ORDER BY hour
	`

	rows, err := r.db.Query(ctx, query, hours)
	if err != nil {
		// Fallback to standard PostgreSQL
		query = `
			SELECT 
				TO_CHAR(date_trunc('hour', created_at), 'HH24:MI') as hour,
				CASE 
					WHEN COUNT(*) > 0 THEN 
						(COUNT(*) FILTER (WHERE status = 'failed')::float / COUNT(*)::float * 100)
					ELSE 0
				END as failure_percent
			FROM tool_calls
			WHERE created_at >= NOW() - make_interval(hours => $1)
			GROUP BY date_trunc('hour', created_at)
			ORDER BY hour
		`
		rows, err = r.db.Query(ctx, query, hours)
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	var results []models.FailureRateDataPoint
	for rows.Next() {
		var dp models.FailureRateDataPoint
		if err := rows.Scan(&dp.Hour, &dp.FailurePercent); err != nil {
			return nil, err
		}
		results = append(results, dp)
	}

	return results, nil
}

// GetRecentToolCalls returns the most recent tool calls
func (r *Repository) GetRecentToolCalls(ctx context.Context, limit int) ([]models.ToolCall, error) {
	query := `
		SELECT 
			id, request_id, tool_name, duration_ms, status,
			input_tokens, output_tokens, error_message, metadata, created_at
		FROM tool_calls
		ORDER BY created_at DESC
		LIMIT $1
	`

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.ToolCall
	for rows.Next() {
		var tc models.ToolCall
		var errorMsg sql.NullString
		if err := rows.Scan(
			&tc.ID, &tc.RequestID, &tc.ToolName, &tc.DurationMs, &tc.Status,
			&tc.InputTokens, &tc.OutputTokens, &errorMsg, &tc.Metadata, &tc.CreatedAt,
		); err != nil {
			return nil, err
		}
		if errorMsg.Valid {
			tc.ErrorMessage = &errorMsg.String
		}
		results = append(results, tc)
	}

	return results, nil
}

// GetToolCallChain returns all tool calls for a specific request ID
func (r *Repository) GetToolCallChain(ctx context.Context, requestID uuid.UUID) ([]models.ToolCall, error) {
	query := `
		SELECT 
			id, request_id, tool_name, duration_ms, status,
			input_tokens, output_tokens, error_message, metadata, created_at
		FROM tool_calls
		WHERE request_id = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(ctx, query, requestID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.ToolCall
	for rows.Next() {
		var tc models.ToolCall
		var errorMsg sql.NullString
		if err := rows.Scan(
			&tc.ID, &tc.RequestID, &tc.ToolName, &tc.DurationMs, &tc.Status,
			&tc.InputTokens, &tc.OutputTokens, &errorMsg, &tc.Metadata, &tc.CreatedAt,
		); err != nil {
			return nil, err
		}
		if errorMsg.Valid {
			tc.ErrorMessage = &errorMsg.String
		}
		results = append(results, tc)
	}

	return results, nil
}

// GetMetricsOverview returns aggregated overview metrics
func (r *Repository) GetMetricsOverview(ctx context.Context, hours int) (*models.MetricsOverview, error) {
	query := `
		SELECT 
			COUNT(*)::bigint as total_calls,
			COALESCE(AVG(duration_ms), 0) as avg_latency_ms,
			COALESCE(SUM(input_tokens + output_tokens), 0)::bigint as total_tokens,
			CASE 
				WHEN COUNT(*) > 0 THEN 
					(COUNT(*) FILTER (WHERE status = 'failed')::float / COUNT(*)::float * 100)
				ELSE 0
			END as failure_rate
		FROM tool_calls
		WHERE created_at >= NOW() - make_interval(hours => $1)
	`

	var overview models.MetricsOverview
	err := r.db.QueryRow(ctx, query, hours).Scan(
		&overview.TotalCalls,
		&overview.AvgLatencyMs,
		&overview.TotalTokens,
		&overview.FailureRate,
	)
	if err != nil {
		return nil, err
	}

	// Calculate change percent (simplified - compare with previous period)
	// In production, you'd want to compare with the same period from before
	overview.ChangePercent = 0.0 // TODO: Implement proper comparison

	return &overview, nil
}
