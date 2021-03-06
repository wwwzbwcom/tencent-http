package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	http.HandleFunc("/", handler)
	port := os.Getenv("SLS_PORT")
	if port == "" {
		port = "18888"
	}
	fmt.Printf("Server running at http://127.0.0.1:%s/\n", port)
	err := http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
	if err != nil {
	}
	fmt.Printf("Server Exit")
}

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello World from HTTP Component running Golang Server Example")
}
