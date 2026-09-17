# API Contract — Environmental Violation Detection Backend

Base URL: http://127.0.0.1:8000

## POST /auth/login
Authenticates a user and returns a JWT.

Request body:
```json
{
  "email": "operator@example.com",
  "password": "secret"
}
```

Returns: 200
```json
{
  "access_token": "<JWT>",
  "token_type": "bearer"
}
```

Errors: 401 if credentials are invalid.

## Authenticated requests
Include the token on protected endpoints:
```
Authorization: Bearer <access_token>
```

JWT payload contains: `sub`/`email`, `role` (`"Admin"` or `"Reviewer"`), `exp`.

There is no registration or password-reset endpoint — accounts are provisioned manually.

## POST /incidents/
Creates a new incident. Used by the CV/ANPR pipeline.

Request body:
```json
{
  "violation_type": "littering",
  "confidence": 0.85,
  "plate_number": "LEA-1234",      // optional, null if no plate
  "plate_confidence": 0.75,         // optional, null if no plate
  "location_lat": 31.5204,          // optional
  "location_lng": 74.3587,          // optional
  "evidence_path": "frame_001.jpg", // optional, filename only
  "bbox_x1": 120.5,                 // optional, pixel coords on the evidence frame
  "bbox_y1": 80.0,                  // optional
  "bbox_x2": 340.0,                 // optional
  "bbox_y2": 210.0,                 // optional
  "frame_width": 1280,              // optional, needed to normalize the bbox
  "frame_height": 720                // optional
}
```

Returns: 201 + the created incident object (includes generated `id`, `timestamp`, `review_status: "pending"`)

## Incident object shape
Returned by POST, GET (list and single). Includes:
```json
{
  "id": 1,
  "timestamp": "2026-09-18T01:53:00",
  "violation_type": "littering",
  "confidence": 0.85,
  "plate_number": "LEA-1234",
  "plate_confidence": 0.75,
  "location_lat": 31.5204,
  "location_lng": 74.3587,
  "evidence_path": "frame_001.jpg",
  "evidence_url": "http://127.0.0.1:8000/evidence/frame_001.jpg",
  "review_status": "pending",
  "notes": null,
  "bbox_x1": 120.5,
  "bbox_y1": 80.0,
  "bbox_x2": 340.0,
  "bbox_y2": 210.0,
  "frame_width": 1280,
  "frame_height": 720,
  "bbox": { "x": 0.32, "y": 0.41, "w": 0.21, "h": 0.17 }
}
```

`bbox` is computed server-side: normalized 0.0–1.0 against the evidence frame. It is `null` whenever any of `bbox_x1/y1/x2/y2/frame_width/frame_height` is missing (e.g. older incidents, or manual `/docs` testing).

## GET /incidents/
Lists incidents. Supports filters:
```
?violation_type=littering&review_status=pending&plate_number=LEA-1234&skip=0&limit=50
```

## GET /incidents/{id}
Returns one incident by id. 404 if not found.

## PATCH /incidents/{id}
Updates review_status and/or notes.
Body: `{ "review_status": "accepted" }`
Allowed review_status values: `pending`, `accepted`, `rejected`, `needs_investigation`

## DELETE /incidents/{id}
Deletes an incident. **Requires Admin role** (`Authorization: Bearer <token>` header, role must be Admin).

Returns: 204 on success.
Errors: 401 if no/invalid token, 403 if authenticated but not Admin, 404 if not found.

## GET /analytics/
Returns: `{ total_incidents, pending_review, by_type, by_day, by_hotspot }`

## Errors
All errors return: `{ "error": "message" }` with standard HTTP status codes (401, 403, 404, 422, etc.)

## Evidence images
Every incident includes `evidence_url` — a full clickable link, ready for `<img src>`.
