# AI Quiz Master

A quiz application that allows users to create, take, and manage quizzes with true/false and multiple-choice questions. The application includes a quiz parser that can convert text-based quiz questions into structured content.

## Features

- Create quizzes with true/false and multiple-choice questions
- Parse quiz text into structured quiz content
- Take quizzes and get immediate results
- View quiz history and performance
- Database-backed storage

## Technologies

- React (Frontend)
- Express (Backend)
- PostgreSQL (Database)
- Drizzle ORM
- TanStack Query
- TypeScript
- Docker

## Deployment Using Docker

This application can be easily deployed using Docker, which ensures consistent environments across different deployments.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

### Option 1: Using Docker Compose (Recommended)

The simplest way to run the application is using Docker Compose, which will set up both the application and the PostgreSQL database:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd quiz-master
   ```

2. Start the application and database:
   ```
   docker-compose up -d
   ```

3. The application will be available at [http://localhost:5000](http://localhost:5000)

4. To stop the application:
   ```
   docker-compose down
   ```

### Option 2: Using Docker with an External PostgreSQL Database

If you want to use an existing PostgreSQL database:

1. Build the Docker image:
   ```
   docker build -t quiz-master .
   ```

2. Run the Docker container with the appropriate DATABASE_URL:
   ```
   docker run -d -p 5000:5000 \
     -e DATABASE_URL=postgresql://username:password@hostname:5432/database \
     quiz-master
   ```

3. The application will be available at [http://localhost:5000](http://localhost:5000)

## Connecting to PostgreSQL

### Using Docker Compose

When using docker-compose, the PostgreSQL database is automatically set up with:
- Host: db (within the Docker network) or localhost (from your machine)
- Port: 5432
- Username: postgres
- Password: postgres
- Database: quizdb

You can connect to the database using a tool like pgAdmin or psql:

```bash
psql -h localhost -p 5432 -U postgres -d quizdb
# Enter the password when prompted: postgres
```

### Persisting Data

The PostgreSQL data is persisted in a Docker volume (`postgres-data`), which means your data will remain even if you stop and restart the containers. To remove all data and start fresh:

```bash
docker-compose down -v
```

### Using a Custom PostgreSQL Configuration

To use a custom PostgreSQL configuration:

1. Edit the `docker-compose.yml` file and update the database environment variables:
   ```yaml
   db:
     environment:
       - POSTGRES_USER=your_custom_user
       - POSTGRES_PASSWORD=your_custom_password
       - POSTGRES_DB=your_custom_db
   ```

2. Also update the application's DATABASE_URL to match:
   ```yaml
   app:
     environment:
       - DATABASE_URL=postgresql://your_custom_user:your_custom_password@db:5432/your_custom_db
   ```

## Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: The environment the application runs in (development/production)
- `PORT`: The port the server listens on (default: 5000)
- `DATABASE_URL`: PostgreSQL connection URL

## Development

To run the application locally without Docker:

1. Install dependencies:
   ```
   npm install
   ```

2. Start a PostgreSQL database:
   ```
   docker run -d -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quizdb postgres:15-alpine
   ```

3. Set up the database connection:
   ```
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quizdb
   ```

4. Run database migrations:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. The application will be available at [http://localhost:5000](http://localhost:5000)

## License

MIT