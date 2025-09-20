import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { 
  Search, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Filter,
  Edit,
  Eye,
  Loader2,
  Building,
  TrendingUp,
  Users
} from 'lucide-react'

export default function DepartmentView() {
  const { adminUser } = useAdminAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Get issues assigned to the current user's department
  const { data: departmentIssues, isLoading } = useQuery({
    queryKey: ['department-issues', adminUser?.departmentId],
    queryFn: () => backend.issues.getAllIssues(),
    select: (data) => data.filter(issue => 
      adminUser?.role === 'department_head' 
        ? issue.assignedDepartment === adminUser.departmentId
        : data
    ),
    enabled: !!adminUser,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ issueId, status, comments }: { issueId: string, status: string, comments?: string }) =>
      backend.issues.updateStatus({ issueId, status, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-issues'] })
      toast({
        title: "Success",
        description: "Issue status updated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update issue status",
        variant: "destructive",
      })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'assigned':
        return 'bg-yellow-500'
      case 'rejected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const filteredIssues = departmentIssues?.filter(issue => {
    const matchesSearch = issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.region.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  const handleUpdateStatus = (issueId: string, status: string, comments?: string) => {
    updateStatusMutation.mutate({ issueId, status, comments })
  }

  // Calculate department stats
  const totalIssues = departmentIssues?.length || 0
  const resolvedIssues = departmentIssues?.filter(issue => issue.status === 'resolved').length || 0
  const inProgressIssues = departmentIssues?.filter(issue => issue.status === 'in_progress').length || 0
  const assignedIssues = departmentIssues?.filter(issue => issue.status === 'assigned').length || 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Department Dashboard</h1>
        <p className="text-muted-foreground">
          Manage issues assigned to your department
        </p>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to department
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inProgressIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {assignedIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search department issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((issue) => (
          <Card key={issue.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between space-x-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(issue.status)} text-white`}
                      >
                        {formatStatus(issue.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        #{issue.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(issue.createdAt)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{issue.category}</h3>
                    <p className="text-muted-foreground mt-1">
                      {issue.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {issue.region}
                    </div>
                    {issue.reportedBy && (
                      <div className="text-sm text-muted-foreground">
                        Reported by: {issue.reportedBy}
                      </div>
                    )}
                  </div>

                  {issue.adminComments && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium">Comments:</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {issue.adminComments}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  {issue.imageUrl && (
                    <img
                      src={issue.imageUrl}
                      alt="Issue"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Issue Status</DialogTitle>
                        <DialogDescription>
                          Update the status and add comments for issue #{issue.id.slice(0, 8)}
                        </DialogDescription>
                      </DialogHeader>
                      <IssueUpdateForm
                        issue={issue}
                        onUpdate={handleUpdateStatus}
                        isLoading={updateStatusMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredIssues.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium">No issues found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No issues have been assigned to your department yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface IssueUpdateFormProps {
  issue: any
  onUpdate: (issueId: string, status: string, comments?: string) => void
  isLoading: boolean
}

function IssueUpdateForm({ issue, onUpdate, isLoading }: IssueUpdateFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(issue.status)
  const [comments, setComments] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStatus !== issue.status) {
      onUpdate(issue.id, selectedStatus, comments)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Comments</Label>
        <Textarea
          id="comments"
          placeholder="Add comments about the status update..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || selectedStatus === issue.status}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Updating...
          </>
        ) : (
          'Update Status'
        )}
      </Button>
    </form>
  )
}