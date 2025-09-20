import { useQuery } from '@tanstack/react-query'
import backend from '~backend/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { 
  Search, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Filter,
  Loader2
} from 'lucide-react'

export default function MyIssues() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: issues, isLoading } = useQuery({
    queryKey: ['my-issues'],
    queryFn: () => backend.issues.getMyIssues(),
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'assigned':
        return <AlertTriangle className="h-4 w-4" />
      case 'rejected':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
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
    
    return matchesSearch && matchesStatus
  }) || []

  const statusCounts = issues?.reduce((acc, issue) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">My Issues</h2>
        <p className="text-muted-foreground">
          Track the status of your reported issues
        </p>
      </div>

      {issues && issues.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{issues.length}</div>
                <div className="text-sm text-muted-foreground">Total Issues</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{statusCounts.resolved || 0}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="relative">
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
            </div>
          </div>

          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(issue.status)} text-white`}
                        >
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(issue.status)}
                            <span>{formatStatus(issue.status)}</span>
                          </div>
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(issue.createdAt)}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-base">{issue.category}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {issue.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {issue.region}
                        </div>
                        {issue.assignedTo && (
                          <div className="text-primary">
                            Assigned to: {issue.assignedTo}
                          </div>
                        )}
                      </div>

                      {issue.adminComments && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Admin Comments:</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {issue.adminComments}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {issue.imageUrl && (
                      <img
                        src={issue.imageUrl}
                        alt="Issue"
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredIssues.length === 0 && searchTerm && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No issues found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {(!issues || issues.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No issues reported yet</h3>
              <p className="text-sm">Start by reporting your first civic issue</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}