import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdversarialPrompts: React.FC = () => {
  const [departmentData, setDepartmentData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [adversarialPrompts, setAdversarialPrompts] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_NODE_API_URL}api/prompts/by-department`)
      .then(res => setDepartmentData(res.data))
      .catch(err => console.error(err));

    axios.get(`${import.meta.env.VITE_NODE_API_URL}api/prompts/timeline`)
      .then(res => setTimelineData(res.data))
      .catch(err => console.error(err));

    axios.get(`${import.meta.env.VITE_NODE_API_URL}api/prompts`)
      .then(res => setAdversarialPrompts(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Adversarial Prompts</h1>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Adversarial Prompts by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {departmentData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Adversarial Prompts Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="prompts" name="Adversarial Prompts" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Adversarial Prompt Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adversarialPrompts.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell className="max-w-md truncate">{item.prompt}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : item.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {item.severity}
                    </Badge>
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

export default AdversarialPrompts;
