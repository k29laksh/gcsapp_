module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Redirect all API calls to Django backend
        destination: "http://localhost:8000/:path*",
      },
    ];
  },
};