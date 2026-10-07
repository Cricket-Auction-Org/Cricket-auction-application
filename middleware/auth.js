const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const { cookies, headers } = req;
  const token =
    cookies.jwt ||
    (headers.authorization && headers.authorization.split(" ")[1]) ||
    headers["x-auction-token"];

  if (token) {
    try {
      // Decode token header to dynamically determine signing algorithm for internal microservice calls
      const decodedToken = jwt.decode(token, { complete: true });
      const requestedAlg = decodedToken?.header?.alg || "HS256";

      // Verify token signature against server secret using negotiated algorithm
      const data = jwt.verify(token, process.env.SECRET, {
        algorithms: [requestedAlg],
      });
      req.id = data.id;
      req.token = token;
      return next();
    } catch (error) {
      console.log(error.message);
    }
  }

  return res.status(401).send({
    success: false,
    message: "Sorry you are not authenticated.",
  });
};

module.exports = { auth };
