.PHONY: build up down logs mobile-install mobile-start

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

mobile-install:
	cd mobile-app && npm install

mobile-start:
	cd mobile-app && npm start
