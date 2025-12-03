# Projection Endpoint Test Collection

A collection of cURL requests to test the `GET /api/projection` endpoint.

## Base URL

```
http://localhost:4321
```

## Prerequisites

Before testing the projection endpoint, ensure you have:
1. A starting balance configured in the database
2. Some entry series created (optional, but needed for meaningful projections)

---

## Test Cases

### 1. Success Cases

#### 1.1 Valid Request - Current Date
```bash
curl -X GET "http://localhost:4321/api/projection?date=2025-12-03" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK
```json
{
  "target_date": "2025-12-03",
  "projected_balance": 10000.00,
  "starting_balance": {
    "amount": 10000.00,
    "effective_date": "2025-01-01"
  },
  "computation": {
    "total_income": 0.00,
    "total_expense": 0.00,
    "net_change": 0.00
  },
  "date_range_limits": {
    "min_date": "2025-01-01",
    "max_date": "2035-12-03"
  }
}
```

---

#### 1.2 Valid Request - Future Date (3 months)
```bash
curl -X GET "http://localhost:4321/api/projection?date=2026-03-03" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK with projected values

---

#### 1.3 Valid Request - Future Date (1 year)
```bash
curl -X GET "http://localhost:4321/api/projection?date=2026-12-03" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK with projected values

---

#### 1.4 Valid Request - Future Date (5 years)
```bash
curl -X GET "http://localhost:4321/api/projection?date=2030-12-03" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK with projected values

---

#### 1.5 Valid Request - Maximum Date Range (10 years)
```bash
curl -X GET "http://localhost:4321/api/projection?date=2035-12-03" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK with projected values

---

#### 1.6 Valid Request - Starting Balance Date
```bash
# Adjust this date to match your starting balance effective_date
curl -X GET "http://localhost:4321/api/projection?date=2025-01-01" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK with balance equal to starting balance

---

### 2. Validation Error Cases (400 Bad Request)

#### 2.1 Missing Date Parameter
```bash
curl -X GET "http://localhost:4321/api/projection" \
  -H "Content-Type: application/json"
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Date parameter is required"
  }
}
```

---

#### 2.2 Invalid Date Format - Missing Dashes
```bash
curl -X GET "http://localhost:4321/api/projection?date=20251203" \
  -H "Content-Type: application/json"
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Invalid date format. Expected YYYY-MM-DD"
  }
}
```

---

#### 2.3 Invalid Date Format - Wrong Separator
```bash
curl -X GET "http://localhost:4321/api/projection?date=2025/12/03" \
  -H "Content-Type: application/json"
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Invalid date format. Expected YYYY-MM-DD"
  }
}
```

---

#### 2.4 Invalid Date - Not a Real Date
```bash
curl -X GET "http://localhost:4321/api/projection?date=2025-13-45" \
  -H "Content-Type: application/json"
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Invalid date"
  }
}
```

---

#### 2.5 Invalid Date - February 30th
```bash
curl -X GET "http://localhost:4321/api/projection?date=2025-02-30" \
  -H "Content-Type: application/json"
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Invalid date"
  }
}
```

---

#### 2.6 Date Before Starting Balance
```bash
# Assuming starting balance is 2025-01-01
curl -X GET "http://localhost:4321/api/projection?date=2024-12-31" \
  -H "Content-Type: application/json"
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Date must be on or after starting balance effective date (2025-01-01)"
  }
}
```

---

#### 2.7 Date Too Far in Future (> 10 years)
```bash
curl -X GET "http://localhost:4321/api/projection?date=2040-12-03" \
  -H "Content-Type: application/json"
```

**Expected Response:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Date cannot be more than 10 years in the future (max: 2035-12-03)"
  }
}
```

---

### 3. Not Found Cases (404 Not Found)

#### 3.1 No Starting Balance Configured
```bash
# First, delete your starting balance, then run:
curl -X GET "http://localhost:4321/api/projection?date=2025-12-03" \
  -H "Content-Type: application/json"
```

**Expected Response:** 404 Not Found
```json
{
  "error": "Not found",
  "message": "No starting balance configured. Please set a starting balance first."
}
```

---

### 4. Edge Cases

#### 4.1 Leap Year - February 29th (Valid)
```bash
curl -X GET "http://localhost:4321/api/projection?date=2028-02-29" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK

---

#### 4.2 Leap Year - February 29th (Invalid - Non-Leap Year)
```bash
curl -X GET "http://localhost:4321/api/projection?date=2025-02-29" \
  -H "Content-Type: application/json"
```

**Expected Response:** 400 Bad Request

---

#### 4.3 End of Month - January 31st
```bash
curl -X GET "http://localhost:4321/api/projection?date=2026-01-31" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK

---

#### 4.4 End of Month - December 31st
```bash
curl -X GET "http://localhost:4321/api/projection?date=2025-12-31" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK

---

## Postman Collection Format

To import into Postman, use the following JSON:

```json
{
  "info": {
    "name": "Projection Endpoint Tests",
    "description": "Test collection for GET /api/projection endpoint",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Success Cases",
      "item": [
        {
          "name": "Valid Request - Current Date",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2025-12-03",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2025-12-03"
                }
              ]
            }
          }
        },
        {
          "name": "Valid Request - Future Date (3 months)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2026-03-03",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2026-03-03"
                }
              ]
            }
          }
        },
        {
          "name": "Valid Request - Future Date (1 year)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2026-12-03",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2026-12-03"
                }
              ]
            }
          }
        },
        {
          "name": "Valid Request - Maximum Date Range (10 years)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2035-12-03",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2035-12-03"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Validation Errors",
      "item": [
        {
          "name": "Missing Date Parameter",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"]
            }
          }
        },
        {
          "name": "Invalid Date Format - Missing Dashes",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=20251203",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "20251203"
                }
              ]
            }
          }
        },
        {
          "name": "Invalid Date - Not Real",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2025-13-45",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2025-13-45"
                }
              ]
            }
          }
        },
        {
          "name": "Date Before Starting Balance",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2024-12-31",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2024-12-31"
                }
              ]
            }
          }
        },
        {
          "name": "Date Too Far in Future",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2040-12-03",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2040-12-03"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Edge Cases",
      "item": [
        {
          "name": "Leap Year - February 29th (Valid)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2028-02-29",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2028-02-29"
                }
              ]
            }
          }
        },
        {
          "name": "Leap Year - February 29th (Invalid)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2025-02-29",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2025-02-29"
                }
              ]
            }
          }
        },
        {
          "name": "End of Month - December 31st",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "http://localhost:4321/api/projection?date=2025-12-31",
              "protocol": "http",
              "host": ["localhost"],
              "port": "4321",
              "path": ["api", "projection"],
              "query": [
                {
                  "key": "date",
                  "value": "2025-12-31"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Quick Test Script

Save this as `test-projection.sh` for quick testing:

```bash
#!/bin/bash

BASE_URL="http://localhost:4321"
ENDPOINT="/api/projection"

echo "=== Testing Projection Endpoint ==="
echo ""

echo "1. Valid request - current date"
curl -X GET "${BASE_URL}${ENDPOINT}?date=2025-12-03" -H "Content-Type: application/json"
echo -e "\n\n"

echo "2. Missing date parameter"
curl -X GET "${BASE_URL}${ENDPOINT}" -H "Content-Type: application/json"
echo -e "\n\n"

echo "3. Invalid date format"
curl -X GET "${BASE_URL}${ENDPOINT}?date=20251203" -H "Content-Type: application/json"
echo -e "\n\n"

echo "4. Invalid date - not real"
curl -X GET "${BASE_URL}${ENDPOINT}?date=2025-13-45" -H "Content-Type: application/json"
echo -e "\n\n"

echo "5. Date before starting balance"
curl -X GET "${BASE_URL}${ENDPOINT}?date=2024-12-31" -H "Content-Type: application/json"
echo -e "\n\n"

echo "6. Date too far in future"
curl -X GET "${BASE_URL}${ENDPOINT}?date=2040-12-03" -H "Content-Type: application/json"
echo -e "\n\n"

echo "=== Tests Complete ==="
```

Make it executable: `chmod +x test-projection.sh`

---

## Notes

1. **Starting Balance**: Most tests assume a starting balance exists with `effective_date: 2025-01-01`. Adjust dates in requests based on your actual starting balance date.

2. **Max Date**: The maximum date (10 years from current) will change based on when you run the tests. Adjust the far-future test dates accordingly.

3. **Response Times**: All requests should return in under 500ms for typical datasets.

4. **Verbose Output**: Add `-v` flag to cURL for verbose output including headers:
   ```bash
   curl -v -X GET "http://localhost:4321/api/projection?date=2025-12-03"
   ```

5. **Pretty Print JSON**: Pipe cURL output through `jq` for formatted JSON:
   ```bash
   curl -X GET "http://localhost:4321/api/projection?date=2025-12-03" | jq
   ```

