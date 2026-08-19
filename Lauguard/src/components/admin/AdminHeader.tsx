import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    department_id: '',
    passwd: '',
  });

  // Fetch departments from backend
  useEffect(() => {
    fetch('http://localhost:5000/api/departments') // adjust backend URL
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((err) => console.error('Error fetching departments:', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('department_id');
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDepartmentChange = (value: string) => {
    setFormData({ ...formData, department_id: value });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('User added successfully');
        setOpen(false);
        setFormData({
          username: '',
          full_name: '',
          email: '',
          department_id: '',
          passwd: '',
        });
      } else {
        alert('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <SidebarTrigger />
          <h1 className="ml-4 text-xl font-semibold text-gray-800">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">Admin User</div>

          {/* Add User Modal */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="icon"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select onValueChange={handleDepartmentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => {
                        const id = dept?.department_id ? dept.department_id.toString() : '';
                        return (
                          <SelectItem key={dept.department_id || dept.department_name} value={id}>
                            {dept.department_name || 'Unnamed Department'}
                          </SelectItem>
                        );
                      })}

                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="passwd">Password</Label>
                  <Input
                    id="passwd"
                    name="passwd"
                    type="password"
                    value={formData.passwd}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit}>Save User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Logout button */}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
