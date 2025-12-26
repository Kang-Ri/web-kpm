require("dotenv").config();


const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const app = express();
const notFoundMiddleware = require("./app/middlewares/not-found");
const handleErrorMiddleware = require("./app/middlewares/handler-error");

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

app.use(cookieParser(process.env.JWT_SECRET_KEY));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

require('./app/db/index');

const v1 = "/api/v1";
const authRouter = require("./app/api/v1/auth/router");
const usersRouter = require("./app/api/v1/users/router");
const parentProduct1Router = require("./app/api/v1/parentProduct1/router");
const parentProduct2Router = require("./app/api/v1/parentProduct2/router");
const productRouter = require("./app/api/v1/product/router");
const formsRouter = require("./app/api/v1/forms/router");
const orderRouter = require("./app/api/v1/order/router");
const formFieldsRouter = require("./app/api/v1/formFields/router");

// LMS Routers (New)
const siswaRouter = require("./app/api/v1/siswa/router");
const orangTuaRouter = require("./app/api/v1/orangTua/router");
const siswaKelasRouter = require("./app/api/v1/siswaKelas/router");
const materiButtonRouter = require("./app/api/v1/materiButton/router");
const aksesMateriRouter = require("./app/api/v1/aksesMateri/router");
const variableTemplatesRouter = require("./app/api/v1/variableTemplates/router");


app.get("/", (req, res) => {
  res.status(200).json({
    message: "Selamat datang di WEB KPM",
  });
});

// Auth & Users (No params)
app.use(`${v1}/cms`, authRouter);
app.use(`${v1}/cms/users`, usersRouter);

// LMS Routes (Specific paths - must be BEFORE parameterized routes!)
app.use(`${v1}/cms`, siswaRouter);
app.use(`${v1}/cms`, orangTuaRouter);
app.use(`${v1}/cms`, siswaKelasRouter);
app.use(`${v1}/cms`, materiButtonRouter);
app.use(`${v1}/cms`, aksesMateriRouter);

// Forms & Fields (Specific paths)
app.use(`${v1}/cms`, formsRouter);
app.use(`${v1}/cms`, formFieldsRouter);
app.use(`${v1}/cms`, variableTemplatesRouter);

// Product Routes (May have :id params - after specific routes)
app.use(`${v1}/cms`, parentProduct1Router);
app.use(`${v1}/cms`, parentProduct2Router);
app.use(`${v1}/cms`, productRouter);

// Order Router (Has :id param - MUST be last)
app.use(`${v1}/cms`, orderRouter);

// Error Middleware
app.use(notFoundMiddleware);
app.use(handleErrorMiddleware);

module.exports = app;