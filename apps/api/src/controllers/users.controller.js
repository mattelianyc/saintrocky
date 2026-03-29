import { buildSessionUser } from "@saintrocky/auth";
import { listUsers as getUsers } from "../services/control-plane.service.js";

export function listUsers(req, res) {
  return res.json(getUsers());
}

export function createUser(req, res) {
  return res.status(201).json({
    ok: true,
    user: buildSessionUser(req.body?.email || "new.user@saintrocky.local")
  });
}

export function getMe(req, res) {
  return res.json({
    ok: true,
    user: buildSessionUser()
  });
}

export function updateMe(req, res) {
  return res.json({
    ok: true,
    user: buildSessionUser(req.body?.email || "operator@saintrocky.local")
  });
}

export function getUser(req, res) {
  return res.json({
    ok: true,
    user: buildSessionUser(`${req.params.id}@saintrocky.local`)
  });
}

export function updateUser(req, res) {
  return res.json({
    ok: true,
    user: buildSessionUser(req.body?.email || `${req.params.id}@saintrocky.local`)
  });
}

export function deleteUser(req, res) {
  return res.json({
    ok: true,
    deletedUserId: req.params.id
  });
}
