# Kontrolownik Zakupów

Aplikacja do kontroli stanów produktów dla Samorządu Studenckiego Wydziału
Informatyki i Telekomunikacji Politechniki Wrocławskiej. Pozwala śledzić ilość
produktów, ich jednostki oraz minimalny stan, a także szybko dodawać i odejmować
sztuki.

## Stack

- **Backend** – Django 6 + Django REST Framework, dokumentacja API przez drf-spectacular (Swagger).
- **Frontend** – React 19 + Vite + Tailwind CSS, routing przez React Router.

## Struktura repozytorium

```
backend/                 # API Django
  kontrolownik/          # konfiguracja projektu (settings, urls, wsgi/asgi)
  products/              # aplikacja produktów (model, widoki, serializery, walidatory)
  manage.py
  requirements.txt
frontend/
  kontrolownik-web/      # aplikacja React (Vite)
    src/
      pages/             # MainList, ProductDetail
      api/               # dane mockowe
.github/workflows/       # pipeline CI/CD (flake8, testy Django, ESLint)
```

## Backend

### Uruchomienie

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### API

Bazowa ścieżka: `/api/`

| Metoda | Endpoint                       | Opis                              |
|--------|--------------------------------|-----------------------------------|
| GET    | `/api/products/`               | lista produktów                   |
| POST   | `/api/products/`               | dodanie produktu                  |
| GET    | `/api/products/{slug}/`        | szczegóły produktu                |
| PUT/PATCH/DELETE | `/api/products/{slug}/` | edycja / usunięcie produktu      |
| POST   | `/api/products/{slug}/add/`    | +1 do ilości                      |
| POST   | `/api/products/{slug}/take/`   | -1 od ilości (blokada przy 0)     |

Dokumentacja:
- Swagger UI: `/api/docs/`
- Schemat OpenAPI: `/api/schema/`
- Panel admina: `/admin/`

### Model `Product`

`name`, `quantity`, `slug`, `unit` (PCS / SLI / BTL / CAP / CRT),
`minimum_quantity`, `expiration_date`.

## Frontend

```bash
cd frontend/kontrolownik-web
npm install
npm run dev      # serwer deweloperski
npm run build    # build produkcyjny
npm run lint     # ESLint
```

## CI/CD

Workflow `.github/workflows/ci-cd.yaml` przy każdym push / PR na `main` lub
`master` uruchamia:

- **backend** – flake8 oraz testy jednostkowe Django,
- **frontend** – ESLint.
