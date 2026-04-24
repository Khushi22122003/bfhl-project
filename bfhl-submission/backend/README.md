# BFHL Backend (Node.js / Express)

SRM Full Stack Engineering Challenge — `POST /bfhl`

## Run locally

```bash
cd node-backend
npm install
npm start    # http://localhost:3001/bfhl
```

## Test

```bash
curl -X POST http://localhost:3001/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data":["A->B","A->C","B->D","C->E","E->F","X->Y","Y->Z","Z->X","P->Q","Q->R","G->H","G->H","G->I","hello","1->2","A->"]}'
```

## Deploy (Heroku)

```bash
heroku login
heroku create <yourname>-bfhl
git subtree push --prefix node-backend heroku main
# or: inside node-backend, `git init && heroku git:remote -a <yourname>-bfhl && git push heroku main`
```

Your submission URL for Question 9:
`https://<yourname>-bfhl.herokuapp.com`   (DO NOT append `/bfhl`)

## Deploy (Render)

1. New → Web Service → point to repo, root directory `node-backend`
2. Build command: `npm install`
3. Start command: `npm start`
4. Submit the service URL (e.g. `https://bfhl-xxxx.onrender.com`).

CORS is enabled for all origins.
