#!/bin/zsh

# Script de gestion MoveMaster (frontend + backend + db)
# Usage: ./movemaster.sh [up|down|build|logs|restart|ps]

SERVICE=${2:-}

case $1 in
  up)
    docker-compose up --build -d
    ;;
  down)
    docker-compose down
    ;;
  build)
    docker-compose build $SERVICE
    ;;
  logs)
    docker-compose logs -f $SERVICE
    ;;
  restart)
    docker-compose restart $SERVICE
    ;;
  ps)
    docker-compose ps
    ;;
  *)
    echo "Usage: $0 [up|down|build|logs|restart|ps] [service]"
    ;;
esac
