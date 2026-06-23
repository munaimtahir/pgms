# Frontend / Backend Truth Map Template — PGMS

| Feature | Frontend route | Visible action | API client | Backend endpoint | Payload match | Response handled | RBAC | Status |
|---|---|---|---|---|---|---|---|---|
| Example | `/dashboard/example` | Save | `exampleApi.save` | `POST /api/example/` | Yes | Yes | Admin | GREEN |

## Status values

- GREEN
- FRONTEND_ONLY
- BACKEND_ONLY
- PAYLOAD_MISMATCH
- RESPONSE_MISMATCH
- RBAC_MISMATCH
- HIDDEN_PAGE
- DUPLICATE_PATHWAY
- UX_OVERLOAD
- NOT_DESIGNED
- NOT_BUILT
