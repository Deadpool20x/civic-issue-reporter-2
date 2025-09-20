import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import backend from '~backend/client'
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
  Loader2
} from 'lucide-react'

interface IssueDetailsModalProps {
  issue: any
  departments: any[]
  onAssign: (issueId: string, departmentId: string, comments?: string) => void
  onUpdateStatus: (issueId: string, status: string, comments?: string) => void
  isLoading: boolean
}

function IssueDetailsModal({ issue, departments, onAssign, onUpdateStatus, isLoading }: IssueDetailsModalProps) {
  const [selectedDepartment, setSelectedDepartment] = useState(issue?.assignedDepartment || '')
  const [selectedStatus, setSelectedStatus] = useState(issue?.status || '')
  const [comments, setComments] = useState('')

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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAssign = () => {
    if (selectedDepartment) {
      onAssign(issue.id, selectedDepartment, comments)
    }
  }

  const handleStatusUpdate = () => {
    if (selectedStatus && selectedStatus !== issue.status) {
      onUpdateStatus(issue.id, selectedStatus, comments)
    }
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Issue Details</DialogTitle>
        <DialogDescription>
          View and manage issue #{issue.id}
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Status</Label>
            <div className="mt-1">
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(issue.status)} text-white`}
              >
                {formatStatus(issue.status)}
              </Badge>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Category</Label>
            <p className="mt-1 text-sm">{issue.category}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Region</Label>
            <p className="mt-1 text-sm flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {issue.region}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Reported On</Label>
            <p className="mt-1 text-sm flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(issue.createdAt)}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Reported By</Label>
            <p className="mt-1 text-sm">{issue.reportedBy || 'Anonymous'}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Description</Label>
            <p className="mt-1 text-sm">{issue.description}</p>
          </div>

          {issue.adminComments && (
            <div>
              <Label className="text-sm font-medium">Admin Comments</Label>
              <p className="mt-1 text-sm bg-muted p-3 rounded">{issue.adminComments}</p>
            </div>
          )}

          {issue.assignedTo && (
            <div>
              <Label className="text-sm font-medium">Assigned To</Label>
              <p className="mt-1 text-sm">{issue.assignedTo}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {issue.imageUrl && (
            <div>
              <Label className="text-sm font-medium">Photo</Label>
              <img
                src={issue.imageUrl}
                alt="Issue"
                className="mt-1 w-full rounded-lg object-cover max-h-64"
              />
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Location Coordinates</Label>
            <p className="mt-1 text-sm font-mono">
              {issue.location?.latitude.toFixed(6)}, {issue.location?.longitude.toFixed(6)}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Actions</h4>
            
            <div className="space-y-2">
              <Label htmlFor="department">Assign to Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Update Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
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
                placeholder="Add comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              {selectedDepartment && selectedDepartment !== issue.assignedDepartment && (
                <Button onClick={handleAssign} disabled={isLoading} className="flex-1">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Assign
                </Button>
              )}
              {selectedStatus && selectedStatus !== issue.status && (
                <Button onClick={handleStatusUpdate} disabled={isLoading} className="flex-1">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Status
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  )
}

export default function IssueManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')

  const { data: issues, isLoading } = useQuery({
    queryKey: ['all-issues'],
    queryFn: () => backend.issues.getAllIssues(),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => backend.admin.getDepartments(),
  })

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => backend.admin.getRegions(),
  })

  const assignMutation = useMutation({
    mutationFn: ({ issueId, departmentId, comments }: { issueId: string, departmentId: string, comments?: string }) =>
      backend.issues.assign({ issueId, departmentId, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-issues'] })
      toast({
        title: "Success",
        description: "Issue assigned successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign issue",
        variant: "destructive",
      })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ issueId, status, comments }: { issueId: string, status: string, comments?: string }) =>
      backend.issues.updateStatus({ issueId, status, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-issues'] })
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

  const filteredIssues = issues?.filter(issue => {
    const matchesSearch = issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.region.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter
    const matchesRegion = regionFilter === 'all' || issue.region === regionFilter
    
    return matchesSearch && matchesStatus && matchesRegion
  }) || []

  const handleAssign = (issueId: string, departmentId: string, comments?: string) => {
    assignMutation.mutate({ issueId, departmentId, comments })
  }

  const handleUpdateStatus = (issueId: string, status: string, comments?: string) => {
    updateStatusMutation.mutate({ issueId, status, comments })
  }

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
        <h1 className="text-3xl font-bold">Issue Management</h1>
        <p className="text-muted-foreground">
          View, assign, and manage all reported civic issues
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
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
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions?.map((region) => (
                <SelectItem key={region.id} value={region.name}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                    {issue.assignedTo && (
                      <div className="text-sm text-primary">
                        Assigned to: {issue.assignedTo}
                      </div>
                    )}
                  </div>
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
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <IssueDetailsModal
                      issue={issue}
                      departments={departments || []}
                      onAssign={handleAssign}
                      onUpdateStatus={handleUpdateStatus}
                      isLoading={assignMutation.isPending || updateStatusMutation.isPending}
                    />
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
                {searchTerm || statusFilter !== 'all' || regionFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No issues have been reported yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}