# SRM Full Stack Round 1 — BFHL Submission
By: Khushi Kumari · RA2311003011224

## Structure
- `backend/`  → Node.js + Express, exposes `POST /bfhl`. Deploy to Heroku/Render.
- `frontend/` → React SPA. Deploy to Vercel/Netlify. Set `REACT_APP_BACKEND_URL`.

## Quick start (local)
```bash
# backend
cd backend && npm install && npm start   # http://localhost:3001/bfhl

# frontend (new terminal)
cd frontend && yarn install
echo 'REACT_APP_BACKEND_URL=http://localhost:3001' > .env
yarn start                                # http://localhost:3000
```

## Deploy
See `backend/README.md` for Heroku / Render steps.
Frontend: import the `frontend/` folder into Vercel, set env var `REACT_APP_BACKEND_URL` to your deployed backend URL.

## Test curl
```bash
curl -X POST http://localhost:3001/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data":["A->B","A->C","B->D","C->E","E->F","X->Y","Y->Z","Z->X","P->Q","Q->R","G->H","G->H","G->I","hello","1->2","A->"]}'
```
