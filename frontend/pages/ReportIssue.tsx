import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import backend from '~backend/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Camera, MapPin, Loader2, Upload, X, Brain, TrendingUp, CheckCircle } from 'lucide-react'

interface Location {
  latitude: number
  longitude: number
}

const ISSUE_CATEGORIES = {
  'Roads & Transport': [
    'Pothole',
    'Broken Street Light',
    'Damaged Signage',
    'Traffic Signal Issue',
    'Road Crack',
    'Missing Road Markings'
  ],
  'Waste Management': [
    'Overflowing Dustbin',
    'Illegal Dumping',
    'Broken Garbage Container',
    'Waste Collection Delay',
    'Littering'
  ],
  'Water Supply': [
    'Water Leakage',
    'No Water Supply',
    'Contaminated Water',
    'Broken Water Pipe',
    'Water Logging'
  ],
  'Public Facilities': [
    'Damaged Public Toilet',
    'Broken Park Equipment',
    'Vandalism',
    'Missing Manhole Cover',
    'Electrical Issues'
  ]
}

export default function ReportIssue() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSpecificIssue, setSelectedSpecificIssue] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<Location | null>(null)
  const [locationError, setLocationError] = useState('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [severityAnalysis, setSeverityAnalysis] = useState<any>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => backend.admin.getRegions(),
  })

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    setIsLoadingLocation(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setIsLoadingLocation(false)
      },
      (error) => {
        setLocationError('Unable to get your location. Please try again.')
        setIsLoadingLocation(false)
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        })
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRegion || !selectedCategory || !selectedSpecificIssue || !description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!location) {
      toast({
        title: "Error",
        description: "Location is required to report an issue",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = ''
      
      if (selectedImage) {
        const uploadResponse = await backend.issues.uploadImage({
          image: selectedImage,
          fileName: `issue_${Date.now()}_${selectedImage.name}`,
        })
        imageUrl = uploadResponse.url
      }

      const response = await backend.issues.report({
        category: selectedSpecificIssue,
        description,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        region: selectedRegion,
        imageUrl,
      })

      setSeverityAnalysis(response.severityAnalysis)
      setShowAnalysis(true)

      toast({
        title: "Success",
        description: response.message,
      })
    } catch (error) {
      console.error('Failed to report issue:', error)
      toast({
        title: "Error",
        description: "Failed to report issue. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const specificIssues = selectedCategory ? ISSUE_CATEGORIES[selectedCategory as keyof typeof ISSUE_CATEGORIES] || [] : []

  if (showAnalysis && severityAnalysis) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Issue Reported Successfully!</h2>
          <p className="text-muted-foreground">
            Your civic issue has been analyzed and submitted
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>AI Severity Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Severity Score</span>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${
                        i < severityAnalysis.score ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold">{severityAnalysis.score}/5</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Confidence</span>
              <span className="font-bold">{severityAnalysis.confidence}%</span>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Analysis Reasoning</span>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {severityAnalysis.reasoning}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Key Factors</span>
              <div className="flex flex-wrap gap-2">
                {severityAnalysis.factors.map((factor: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/my-issues')}
            className="w-full"
          >
            View My Issues
          </Button>
          <Button
            onClick={() => {
              setShowAnalysis(false)
              setSeverityAnalysis(null)
              setSelectedRegion('')
              setSelectedCategory('')
              setSelectedSpecificIssue('')
              setDescription('')
              setSelectedImage(null)
              setImagePreview(null)
            }}
            variant="outline"
            className="w-full"
          >
            Report Another Issue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Report an Issue</h2>
        <p className="text-muted-foreground">
          Help us improve Jharkhand by reporting civic issues
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {location
                    ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                    : 'Getting location...'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
            {locationError && (
              <p className="text-sm text-destructive">{locationError}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  {regions?.map((region) => (
                    <SelectItem key={region.id} value={region.name}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value)
                setSelectedSpecificIssue('')
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ISSUE_CATEGORIES).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label htmlFor="specific-issue">Specific Issue *</Label>
                <Select value={selectedSpecificIssue} onValueChange={setSelectedSpecificIssue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specific issue" />
                  </SelectTrigger>
                  <SelectContent>
                    {specificIssues.map((issue) => (
                      <SelectItem key={issue} value={issue}>
                        {issue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photo (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Issue preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    Tap to add a photo of the issue
                  </span>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12"
          disabled={isSubmitting || !location}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reporting Issue...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Report Issue
            </>
          )}
        </Button>
      </form>
    </div>
  )
}