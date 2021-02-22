FROM rust
COPY ./src /workdir/src
COPY ./Cargo.lock /workdir/Cargo.lock
COPY ./Cargo.toml /workdir/Cargo.toml
WORKDIR /workdir
RUN rustup target add x86_64-unknown-linux-musl
RUN cargo build --release --target x86_64-unknown-linux-musl
