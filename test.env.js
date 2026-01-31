import dotenv from "dotenv";
dotenv.config({
    path:'./.env'
});

console.log("TEST ENV:", process.env.TEST_ENV);
