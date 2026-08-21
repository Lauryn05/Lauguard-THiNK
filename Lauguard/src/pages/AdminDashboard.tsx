import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, MessageSquare, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPrompts: 0,
    adversarialAttempts: 0,
    activeDepartments: 0,
    securityRules: 0,
  });

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await axios.get(`${import.meta.env.VITE_NODE_API_URL}api/prompts/stats`);
        setStats({
          totalPrompts: statsRes.data?.totalPrompts || 0,
          adversarialAttempts: statsRes.data?.adversarialAttempts || 0,
          activeDepartments: statsRes.data?.activeDepartments || 0,
          securityRules: statsRes.data?.securityRules || 0,
        });

        // Fetch weekly data
        const timelineRes = await axios.get(`${import.meta.env.VITE_NODE_API_URL}api/prompts/timeline`);
        const mappedData = (timelineRes.data || []).map((item: any) => ({
          name: item?.name || 'Unknown',
          prompts: item?.prompts || 0,
          adversarial: item?.adversarial || 0,
        }));
        setWeeklyData(mappedData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
            <MessageSquare className="h-4 w-4 text-guard-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrompts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adversarial Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-guard-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adversarialAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Departments</CardTitle>
            <Users className="h-4 w-4 text-guard-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDepartments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Rules</CardTitle>
            <Shield className="h-4 w-4 text-guard-amber" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securityRules}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="prompts" name="Total Prompts" fill="#3b82f6" />
                  <Bar dataKey="adversarial" name="Adversarial Prompts" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No weekly activity data
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
