import { useQuery } from '@tanstack/react-query'
import backend from '~backend/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  Users,
  Building
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => backend.admin.dashboardStats(),
  })

  const { data: recentIssues, isLoading: issuesLoading } = useQuery({
    queryKey: ['recent-issues'],
    queryFn: () => backend.issues.getAllIssues(),
    select: (data) => data.slice(0, 5),
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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const resolutionRate = stats ? 
    Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of civic issues and system performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIssues || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.todayIssues || 0} reported today
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
              {stats?.resolvedIssues || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {resolutionRate}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendingIssues || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageResolutionTime || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              days to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
            <CardDescription>Latest reported civic issues</CardDescription>
          </CardHeader>
          <CardContent>
            {issuesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentIssues && recentIssues.length > 0 ? (
              <div className="space-y-4">
                {recentIssues.map((issue) => (
                  <div key={issue.id} className="flex items-start justify-between space-x-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(issue.status)} text-white text-xs`}
                        >
                          {formatStatus(issue.status)}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm">{issue.category}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {issue.description}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {issue.region} • {formatDate(issue.createdAt)}
                      </div>
                    </div>
                    {issue.imageUrl && (
                      <img
                        src={issue.imageUrl}
                        alt="Issue"
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No issues reported yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution</CardTitle>
            <CardDescription>Issues by region and category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-3">Top Regions</h4>
                <div className="space-y-2">
                  {stats?.regionStats?.slice(0, 5).map((region) => (
                    <div key={region.region} className="flex items-center justify-between">
                      <span className="text-sm">{region.region}</span>
                      <Badge variant="outline">{region.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-3">Top Categories</h4>
                <div className="space-y-2">
                  {stats?.categoryStats?.slice(0, 5).map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <span className="text-sm">{category.category}</span>
                      <Badge variant="outline">{category.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Issues Map</CardTitle>
            <CardDescription>Geographic distribution of issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Interactive map</p>
                <p className="text-xs">Coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>System performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Response Time</span>
              <Badge variant="outline" className="text-green-600">
                &lt; 2h
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">User Satisfaction</span>
              <Badge variant="outline" className="text-blue-600">
                85%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Users</span>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {stats?.activeUsers || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Departments</span>
              <Badge variant="outline">
                <Building className="h-3 w-3 mr-1" />
                {stats?.activeDepartments || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <Badge 
                variant="outline" 
                className="justify-center p-2 cursor-pointer hover:bg-muted"
              >
                Assign Issues
              </Badge>
              <Badge 
                variant="outline" 
                className="justify-center p-2 cursor-pointer hover:bg-muted"
              >
                Generate Reports
              </Badge>
              <Badge 
                variant="outline" 
                className="justify-center p-2 cursor-pointer hover:bg-muted"
              >
                Create Department
              </Badge>
              <Badge 
                variant="outline" 
                className="justify-center p-2 cursor-pointer hover:bg-muted"
              >
                Export Data
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}