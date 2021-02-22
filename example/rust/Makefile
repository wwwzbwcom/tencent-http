clean:
	rm -rf ./target

build:
	docker build -t rust-example .
	docker run  --name rust-example rust-example
	docker cp rust-example:/workdir/target/x86_64-unknown-linux-musl/release/rust ./main

dev:
	cargo run

deploy: clean build
	sls deploy --debug
