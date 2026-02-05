const myLoggerMiddelware = function (req, res, next) {
     const reset = "\x1b[0m";
     const green = "\x1b[32m";
     const blue = "\x1b[34m";
     const yellow = "\x1b[33m";
     const red = "\x1b[31m";
     const cyan = "\x1b[36m";

     const timestamp = new Date().toISOString();
     const method = req.method.padEnd(6);
     const url = req.url;

     // Couleur selon la méthode HTTP
     const methodColor =
       {
         GET: green,
         POST: blue,
         PUT: yellow,
         DELETE: red,
         PATCH: cyan,
       }[req.method] || green;

     console.log(
       `${blue}[${timestamp}]${reset} ` +
         `${methodColor}${method}${reset} ` +
         `${cyan}${url}${reset}`
     );

    next();
    
    res.on("finish", () => {
      const statusColor = res.statusCode >= 400 ? red : green;
      console.log(
        `${blue}[${timestamp}]${reset} ` +
          `${statusColor}${res.statusCode}${reset} ` +
          `${cyan}${url}${reset} ` +
          `(${res.get("Content-Length") || "N/A"} bytes)`
      );
    });
  
}

module.exports = myLoggerMiddelware;