FROM golang:1.25-alpine

WORKDIR /app

RUN go install github.com/air-verse/air@latest
RUN go install github.com/pressly/goose/v3/cmd/goose@latest

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . ./

EXPOSE 8001

CMD ["air"]