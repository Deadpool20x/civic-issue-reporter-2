import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import backend from '~backend/client'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, MapPin } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  const { data: myIssues, isLoading } = useQuery({
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
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const recentIssues = myIssues?.slice(0, 3) || []
  const totalIssues = myIssues?.length || 0
  const resolvedIssues = myIssues?.filter(issue => issue.status === 'resolved').length || 0
  const pendingIssues = totalIssues - resolvedIssues

  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Welcome back!</h2>
        <p className="text-muted-foreground">
          Hi {user?.name || 'Citizen'}, let's make Jharkhand better together
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalIssues}</div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{resolvedIssues}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingIssues}</div>
          <div className="text-sm text-muted-foreground">Pending Issues</div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button asChild className="h-16">
            <Link to="/report" className="flex flex-col items-center space-y-1">
              <Plus className="h-6 w-6" />
              <span>Report Issue</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-16">
            <Link to="/my-issues" className="flex flex-col items-center space-y-1">
              <FileText className="h-6 w-6" />
              <span>My Issues</span>
            </Link>
          </Button>
        </div>
      </div>

      {recentIssues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Issues</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/my-issues">View All</Link>
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentIssues.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(issue.status)} text-white`}
                        >
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(issue.status)}
                            <span>{formatStatus(issue.status)}</span>
                          </div>
                        </Badge>
                      </div>
                      <h4 className="font-medium">{issue.category}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {issue.description}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {issue.region}
                      </div>
                    </div>
                    {issue.imageUrl && (
                      <img
                        src={issue.imageUrl}
                        alt="Issue"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {totalIssues === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No issues reported yet</h3>
              <p className="text-sm">Start by reporting your first civic issue</p>
            </div>
            <Button asChild>
              <Link to="/report">Report Your First Issue</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}