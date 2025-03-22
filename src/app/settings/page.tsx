"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PasswordResetForm from "../components/PasswordResetForm"
import AdminPasswordReset from "../components/AdminPasswordReset"
import { useAppContext } from "../context/AppContext"
import Navbar from "../components/Navbar"

export default function SettingsPage() {
  const { currentUser, setCurrentUser } = useAppContext()

  return (
    <>
      <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="password">Password</TabsTrigger>
            {currentUser?.isAdmin && <TabsTrigger value="admin">Admin Tools</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="password">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Reset Your Password</h2>
              <p className="text-gray-600 mb-4">Update your password by entering your current password and a new one.</p>
              <PasswordResetForm />
            </div>
          </TabsContent>
          
          {currentUser?.isAdmin && (
            <TabsContent value="admin">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Admin Password Reset</h2>
                <p className="text-gray-600 mb-4">As an administrator, you can reset passwords for other employees.</p>
                <AdminPasswordReset />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  )
} 