"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@nextui-org/react";
import { Card, CardContent, Typography, Grid } from "@material-ui/core";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import toast, { Toaster } from "react-hot-toast";
import { addNewUser } from "@/lib/actions/users.action";

type CreateNewUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tab: string;
};

function CreateNewUserModal({ isOpen, onClose, tab }: CreateNewUserModalProps) {
  const [role, setRole] = useState("0");
  const [email, setEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [emailError, setEmailError] = useState("");

  const handleEmailChange = (e: any) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    if (!emailRegex.test(newEmail)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleCreateUser = async () => {
    if (emailError) {
      return;
    }

    const data = {
      email: email,
      role: tab,
      ...(!role && { subRole: role }),
    };

    try {
      setIsCreating(true);
      const response = await addNewUser(data);
      if (response?.message === "User created successfully") {
        toast.success(response?.message);
        onClose();
      } else {
        toast.error(response?.message);
      }
    } catch (error: any) {
      throw new Error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const isDisabled = () => {
    if (emailError) return true;
    if (email === "") return true;
    if (role === "0") return true;
    return false;
  };

  return (
    <>
      <Modal
        backdrop="blur"
        isDismissable={false}
        size="2xl"
        isOpen={isOpen}
        onOpenChange={onClose}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Create New {tab === "admin" ? "Admin" : "Checker"}
          </ModalHeader>
          <ModalBody>
            <Card style={{ margin: "1rem", padding: "1rem" }}>
              <CardContent>
                <Grid container alignItems="center" spacing={4}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary">Email:</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      value={email}
                      onChange={handleEmailChange}
                      label="Enter Email"
                      variant="standard"
                      type="email"
                      error={!!emailError}
                      helperText={emailError}
                    />
                  </Grid>

                  {tab === "admin" && (
                    <>
                      <Grid item xs={6}>
                        <Typography color="textSecondary">Role:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Select
                          variant="standard"
                          label="Select Role"
                          className={`w-[200px]`}
                          value={role}
                          defaultValue="0"
                          onChange={(e) => setRole(e.target.value)}
                        >
                          <MenuItem value={0} disabled>
                            Select Role
                          </MenuItem>
                          <MenuItem value="supreme">Supreme</MenuItem>
                          <MenuItem value="super">Super</MenuItem>
                          <MenuItem value="normal">Normal</MenuItem>
                        </Select>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </ModalBody>

          <ModalFooter>
            <Button color="danger" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color={isDisabled() ? "default" : "primary"}
              disabled={isDisabled() || isCreating}
              onClick={handleCreateUser}
            >
              {isCreating ? (
                <>
                  <Spinner size="sm" color="default" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Toaster position="top-center" />
    </>
  );
}

export default CreateNewUserModal;
