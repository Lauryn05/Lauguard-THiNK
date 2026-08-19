import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

interface Department {
  id: number;
  name: string;
  membersCount: number;
  rulesCount: number;
  status: 'active' | 'inactive';
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await axios.get('http://localhost:5000/api/prompts/departments');
    console.log('API response:', res.data);

    if (!Array.isArray(res.data)) throw new Error('Invalid API response');

    const mapped: Department[] = res.data.map((d: any) => ({
      id: Number(d.id),
      name: String(d.name),
      membersCount: Number(d.membersCount),
      rulesCount: Number(d.rulesCount),
      status: d.status === 'active' ? 'active' : 'inactive',
    }));

    setDepartments(mapped);
  } catch (err) {
    console.error('Error fetching departments:', err);
    setError('Failed to fetch departments. Please check your API or network.');
  } finally {
    setLoading(false);
  }
};


  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast({
        title: "Error",
        description: "Department name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/prompts/departmentsadd', { name: newDepartmentName });
      toast({ title: "Success", description: `Department "${newDepartmentName}" has been created` });
      setNewDepartmentName('');
      setIsDialogOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error('Error creating department:', err);
      toast({ title: "Error", description: "Failed to create department", variant: "destructive" });
    }
  };

  const toggleStatus = async (id: number, currentStatus: 'active' | 'inactive') => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    const res = await axios.patch(`http://localhost:5000/api/prompts/departments/${id}`, { status: newStatus });

    // Optimistically update the state so UI reflects change immediately
    setDepartments(departments.map(d => 
      d.id === id ? { ...d, status: newStatus } : d
    ));

    toast({ title: "Status Updated", description: `Department status changed to ${newStatus}` });
  } catch (err) {
    console.error('Error updating status:', err);
    toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
  }
};

  if (loading) return <div>Loading departments...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Departments</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Department</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  placeholder="Enter department name"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                />
              </div>
              <Button onClick={handleAddDepartment} className="w-full">Create Department</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Security Rules</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.membersCount}</TableCell>
                  <TableCell>{department.rulesCount}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        department.status === 'active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }
                    >
                      {department.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(department.id, department.status)}
                    >
                      {department.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Departments;
