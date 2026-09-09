{
  description = "true-lable dev environment (Rust backend + bun/Turborepo web)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells = {
          backend = pkgs.mkShell {
            packages = with pkgs; [
              rustc
              cargo
              rust-analyzer
              clippy
              rustfmt
              sqlx-cli
              postgresql # psql client, for poking at the dev DB
              redis # redis-cli
              docker-client
              kubectl
            ];
            RUST_LOG = "info";
          };

          web = pkgs.mkShell {
            packages = with pkgs; [
              bun
              nodejs_24
              docker-client
              kubectl
            ];
          };

          default = pkgs.mkShell {
            packages = with pkgs; [
              rustc
              cargo
              rust-analyzer
              clippy
              rustfmt
              sqlx-cli
              postgresql
              redis
              bun
              nodejs_24
              docker-client
              docker-compose
              kubectl
            ];
            RUST_LOG = "info";
          };
        };
      });
}
