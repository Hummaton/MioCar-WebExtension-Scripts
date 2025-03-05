import boto3
import json

cloudwatch = boto3.client("cloudwatch")

def lambda_handler(event, context):
    try:
        # Parse request body safely
        body = json.loads(event.get("body", "{}"))

        # Extract required parameters
        status = body.get("status", "UNKNOWN").upper()
        message = body.get("message", "No message provided")
        feature = body.get("feature", "unknown_feature")
        
        # Extract optional parameters
        time_saved = body.get("time_saved")
        api_request_param = body.get("api_request_param")
        api_response_param = body.get("api_response_param")
        additional = body.get("additional", {})

        # Merge all additional details into a single structure
        details = {
            **({"time_saved": time_saved} if time_saved is not None else {}),
            **({"apiRequest": api_request_param} if api_request_param else {}),
            **({"apiResponse": api_response_param} if api_response_param else {}),
            **additional
        }

        # Construct CloudWatch metric data
        metric_data = [
            {
                "MetricName": "APIUsage",
                "Dimensions": [{"Name": "Feature", "Value": feature}],
                "Value": 1,
                "Unit": "Count"
            }
        ]

        # If time_saved is present, log it as a separate metric
        if time_saved is not None:
            metric_data.append({
                "MetricName": "TimeSaved",
                "Dimensions": [{"Name": "Feature", "Value": feature}],
                "Value": time_saved,
                "Unit": "Seconds"
            })

        # Send metric to CloudWatch
        cloudwatch.put_metric_data(
            Namespace="MyAPIMetrics",
            MetricData=metric_data
        )

        # Build structured log response
        log_entry = {
            "timestamp": context.aws_request_id if context else "N/A",
            "level": status,
            "feature": feature,
            "message": message,
            "details": details if details else None  # Only include details if available
        }

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS, POST",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"message": "Metric logged successfully", "log_entry": log_entry})
        }

    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS, POST",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"error": "Invalid JSON format"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS, POST",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"error": str(e)})
        }
