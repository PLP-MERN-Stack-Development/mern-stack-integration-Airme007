import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/integrations/mongodb/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload } from "lucide-react";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  excerpt: z.string().trim().max(500, "Excerpt must be less than 500 characters").optional(),
  content: z.string().trim().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
});

const categories = [
  "Technology",
  "Lifestyle",
  "Travel",
  "Food",
  "Business",
  "Health",
  "Entertainment",
  "Other"
];

export default function CreatePost() {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Other");
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isEdit = !!slug;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isEdit && user) {
      fetchPost();
    }
  }, [slug, user]);

  const fetchPost = async () => {
    try {
      const data = await apiClient.getPost(slug);

      if (data.author._id !== user?.id && data.author !== user?.id) {
        toast({
          variant: "destructive",
          title: "Unauthorized",
          description: "You can only edit your own posts",
        });
        navigate("/");
        return;
      }

      setTitle(data.title);
      setExcerpt(data.excerpt || "");
      setContent(data.content);
      setCategory(data.category || "Other");
      if (data.coverImageUrl) {
        setCoverImagePreview(data.coverImageUrl);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch post",
      });
      navigate("/");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e, published) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = postSchema.safeParse({ title, excerpt, content, category });
    if (!result.success) {
      const newErrors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0]] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      let coverImageUrl = coverImagePreview;

      // For now, we'll skip image upload and just use the preview
      // In a real implementation, you'd upload to a service like Cloudinary

      const postSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const postData = {
        title,
        slug: postSlug,
        excerpt: excerpt || null,
        content,
        category,
        coverImageUrl: coverImageUrl || null,
        published,
      };

      if (isEdit) {
        await apiClient.updatePost(slug, postData);
        toast({
          title: "Success",
          description: "Post updated successfully",
        });
      } else {
        await apiClient.createPost(postData);
        toast({
          title: "Success",
          description: published ? "Post published successfully" : "Post saved as draft",
        });
      }

      navigate(`/post/${postSlug}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Edit Post" : "Create New Post"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cover-image">Cover Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="cover-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("cover-image")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                  {coverImagePreview && (
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="h-20 w-32 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of your post"
                  rows={2}
                />
                {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content here..."
                  rows={15}
                  className="font-mono"
                />
                {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  variant="outline"
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading}
                >
                  {isLoading ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
