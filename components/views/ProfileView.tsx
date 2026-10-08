"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp } from "../../context/AppContext";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { RoleBadge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input, Select } from "../ui/Input";
import {
  User,
  EnvelopeSimple,
  Phone,
  Buildings,
  IdentificationBadge,
  Key,
  SignOut,
  PencilSimple,
  CheckCircle,
  WarningCircle,
  ShieldCheck,
} from "@phosphor-icons/react";

export function ProfileView() {
  const { currentUser, updateUserProfile, logout } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(currentUser.name);
  const [editContact, setEditContact] = useState(currentUser.contactNumber || "");
  const [editDept, setEditDept] = useState(currentUser.department);

  // Password Form State
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handleSaveProfile = () => {
    updateUserProfile({
      name: editName,
      contactNumber: editContact,
      department: editDept,
    });
    setIsEditModalOpen(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) {
      setPassError("All fields are required.");
      return;
    }
    if (newPass.length < 6) {
      setPassError("New password must be at least 6 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("New passwords do not match.");
      return;
    }

    // Update password
    updateUserProfile({ password: newPass });
    setPassError(null);
    setPassSuccess("Password updated successfully!");
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setPassSuccess(null);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            User Profile & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage your university account details, contact parameters, and authentication security
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          icon={<SignOut size={16} weight="bold" className="text-rose-600" />}
          className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        >
          Sign Out of UniSpace
        </Button>
      </div>

      {/* Main Profile Card */}
      <Card className="overflow-hidden">
        {/* Banner with Academic Green */}
        <div className="h-28 bg-gradient-to-r from-[#0F5132] to-[#0A3622] relative flex items-end px-6 pb-4">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-xs text-emerald-200">Account Status:</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-[#0A3622]">
              {currentUser.status}
            </span>
          </div>
        </div>

        <CardBody className="p-6 pt-0 relative">
          {/* Avatar & Basic Info Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-md flex items-center justify-center text-3xl font-bold text-[#0F5132] dark:text-emerald-400 shrink-0">
                {currentUser.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {currentUser.name}
                  </h2>
                  <RoleBadge role={currentUser.role} />
                </div>
                <div className="text-xs text-zinc-500 flex items-center gap-2 flex-wrap">
                  <span>ID: {currentUser.studentOrEmployeeId}</span>
                  <span>·</span>
                  <span>{currentUser.department}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditName(currentUser.name);
                  setEditContact(currentUser.contactNumber || "");
                  setEditDept(currentUser.department);
                  setIsEditModalOpen(true);
                }}
                icon={<PencilSimple size={14} weight="bold" />}
                className="min-h-[44px] sm:min-h-0 text-xs justify-center"
              >
                Edit Profile
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPasswordModalOpen(true)}
                icon={<Key size={14} weight="bold" />}
                className="min-h-[44px] sm:min-h-0 text-xs justify-center"
              >
                Change Password
              </Button>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300">
                <EnvelopeSimple size={18} weight="bold" />
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Institutional Email
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentUser.email}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  Verified Academic Domain
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <Phone size={18} weight="bold" />
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Contact Number
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentUser.contactNumber || "Not configured"}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Used for schedule alerts
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                <Buildings size={18} weight="bold" />
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  Department / College
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentUser.department}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Primary organizational unit
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <IdentificationBadge size={18} weight="bold" />
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                  ID Badge Number
                </span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentUser.studentOrEmployeeId}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Issued by Greenwich Registrar
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile Information"
        subtitle="Update contact coordinates for facility reservation notices"
        maxWidth="md"
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              className="min-h-[44px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProfile}
              className="min-h-[44px] sm:min-h-0"
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Input
            label="Contact Number"
            value={editContact}
            onChange={(e) => setEditContact(e.target.value)}
            placeholder="+1 (555) 000-0000"
            required
          />
          <Input
            label="Department / College"
            value={editDept}
            onChange={(e) => setEditDept(e.target.value)}
            required
          />
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Account Password"
        subtitle="Security credential update"
        maxWidth="md"
        footer={null}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-emerald-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            helperText="Minimum 6 characters"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
          />

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
              className="min-h-[44px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
