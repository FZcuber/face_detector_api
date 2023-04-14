import express from "express";
import bcrypt from "bcrypt-nodejs";
import cors from "cors";
import knex from "knex";

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "",
    database: "smart-brain",
  },
});

const app = express();

app.use(cors());
app.use(express.json());

app.post("/signin", async (req, res) => {
  try {
    const data = await db
      .select("email", "hash")
      .from("login")
      .where("email", "=", req.body.email);
    const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
    if (isValid) {
      const user = await db
        .select("*")
        .from("users")
        .where("email", "=", req.body.email);
      res.json(user[0]);
    } else {
      res.status(400).json("wrong credentials");
    }
  } catch (err) {
    res.status(400).json("wrong credentials");
  }
});

app.post("/register", async (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  try {
    await db.transaction(async (trx) => {
      const loginEmail = await trx
        .insert({ hash: hash, email: email })
        .into("login")
        .returning("email");
      const user = await trx("users")
        .returning("*")
        .insert({ email: loginEmail[0].email, name: name, joined: new Date() });
      res.json(user[0]);
    });
  } catch (err) {
    res.status(400).json("unable to register");
  }
});

app.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.select("*").from("users").where({ id });
    if (user.length) {
      res.json(user[0]);
    } else {
      res.status(400).json("Not found");
    }
  } catch (err) {
    res.status(400).json("error getting user");
  }
});

app.put("/image", async (req, res) => {
  const { id } = req.body;
  try {
    const entries = await db("users")
      .where("id", "=", id)
      .increment("entries", 1)
      .returning("entries");
    res.json(entries[0].entries);
  } catch (err) {
    res.status(400).json("unable to get entries");
  }
});

app.listen(3000, () => {
  console.log("app is running on port 3000");
});
