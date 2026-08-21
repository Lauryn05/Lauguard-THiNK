import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Rule {
  id: number;
  name: string;
  pattern: string;
  replacement: string;
  type: 'masking' | 'adversarial';
  active: boolean;
}

const RuleSettings: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  const [newRule, setNewRule] = useState({
    name: "",
    pattern: "",
    replacement: "",
    type: "masking"
  });

  const { toast } = useToast();

  // Fetch rules
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${import.meta.env.VITE_NODE_API_URL}api/rules`);
      const mappedRules = res.data.map((r: any) => ({
        id: r.id,
        name: r.name,
        pattern: r.pattern,
        replacement: r.replacement,
        type: r.description === 'adversarial' ? 'adversarial' : 'masking',
        active: r.status === 'enabled'
      }));
      setRules(mappedRules);
    } catch (err) {
      console.error('Error fetching rules:', err);
      setError('Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  };

  // Add new rule
  const handleAddRule = async () => {
    if (!newRule.name || !newRule.pattern) {
      toast({
        title: "Error",
        description: "Name and pattern are required",
        variant: "destructive"
      });
      return;
    }

    try {
      new RegExp(newRule.pattern); // validate regex

      const res = await axios.post(`${import.meta.env.VITE_NODE_API_URL}api/rules`, {
        name: newRule.name,
        pattern: newRule.pattern,
        replacement: newRule.replacement,
        description: newRule.type,
        status: 'enabled'
      });

      const addedRule: Rule = {
        id: res.data.id,
        name: res.data.name,
        pattern: res.data.pattern,
        replacement: res.data.replacement,
        type: res.data.description === 'adversarial' ? 'adversarial' : 'masking',
        active: true
      };

      setRules([addedRule, ...rules]);
      setNewRule({ name: "", pattern: "", replacement: "", type: "masking" });
      setIsAddDialogOpen(false);

      toast({ title: "Success", description: `Rule "${newRule.name}" has been created` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to create rule", variant: "destructive" });
    }
  };

  // Toggle active/inactive
  const toggleRuleStatus = async (id: number) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;

    const newStatus = rule.active ? 'disabled' : 'enabled';

    try {
      await axios.patch(`${import.meta.env.VITE_NODE_API_URL}api/rules/${id}`, { status: newStatus });
      setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));

      toast({
        title: "Status Updated",
        description: `Rule "${rule.name}" is now ${newStatus}`,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  // Open edit dialog
  const openEditDialog = (rule: Rule) => {
    setSelectedRule({ ...rule }); // copy to avoid mutating directly
    setIsEditDialogOpen(true);
  };

  // Save edited rule
  const handleSaveEdit = async () => {
    if (!selectedRule) return;
    if (!selectedRule.name || !selectedRule.pattern) {
      toast({ title: "Error", description: "Name and pattern are required", variant: "destructive" });
      return;
    }

    try {
      new RegExp(selectedRule.pattern);

      await axios.patch(`${import.meta.env.VITE_NODE_API_URL}api/rules/${selectedRule.id}`, {
        name: selectedRule.name,
        pattern: selectedRule.pattern,
        replacement: selectedRule.replacement,
        description: selectedRule.type
      });

      setRules(rules.map(r => r.id === selectedRule.id ? selectedRule : r));
      setIsEditDialogOpen(false);

      toast({ title: "Success", description: `Rule "${selectedRule.name}" has been updated` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update rule", variant: "destructive" });
    }
  };

  if (loading) return <div>Loading rules...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header + Add Rule */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Security Rules</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
  <DialogTrigger asChild>
    <Button>Add New Rule</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Security Rule</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input 
          id="name" 
          placeholder="e.g., Phone Number Masking" 
          value={newRule.name}
          onChange={(e) => setNewRule({...newRule, name: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Rule Type</Label>
        <Select 
          value={newRule.type}
          onValueChange={(value) => setNewRule({...newRule, type: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="masking">Masking</SelectItem>
            <SelectItem value="adversarial">Adversarial Detection</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pattern">
          Regex Pattern
          <span className="ml-1 text-xs text-muted-foreground">(JavaScript RegExp)</span>
        </Label>
        <Textarea 
          id="pattern" 
          placeholder="e.g., \b\d{3}[-.]?\d{3}[-.]?\d{4}\b" 
          value={newRule.pattern}
          onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
        />
      </div>
      {newRule.type === "masking" && (
        <div className="space-y-2">
          <Label htmlFor="replacement">Replacement</Label>
          <Input 
            id="replacement" 
            placeholder="e.g., ***-***-****" 
            value={newRule.replacement}
            onChange={(e) => setNewRule({...newRule, replacement: e.target.value})}
          />
        </div>
      )}
      {/* Button to add the rule */}
      <Button 
        onClick={handleAddRule} 
        className="w-full"
      >
        Create Rule
      </Button>
    </div>
  </DialogContent>
</Dialog>

      </div>
      
      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pattern</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Replacement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">{rule.pattern}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={rule.type === 'masking' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}
                    >
                      {rule.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.replacement || 'N/A'}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={rule.active} 
                      onCheckedChange={() => toggleRuleStatus(rule.id)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(rule)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      {selectedRule && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={selectedRule.name}
                  onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={selectedRule.type}
                  onValueChange={(value) => setSelectedRule({ ...selectedRule})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masking">Masking</SelectItem>
                    <SelectItem value="adversarial">Adversarial Detection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Regex Pattern</Label>
                <Textarea
                  value={selectedRule.pattern}
                  onChange={(e) => setSelectedRule({ ...selectedRule, pattern: e.target.value })}
                />
              </div>
              {selectedRule.type === "masking" && (
                <div className="space-y-2">
                  <Label>Replacement</Label>
                  <Input
                    value={selectedRule.replacement}
                    onChange={(e) => setSelectedRule({ ...selectedRule, replacement: e.target.value })}
                  />
                </div>
              )}
              <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RuleSettings;
