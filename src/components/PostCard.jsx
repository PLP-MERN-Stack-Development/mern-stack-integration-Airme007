import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/integrations/mongodb/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";

export function PostCard({
  id,
  title,
  excerpt,
  category,
  coverImage,
  authorName,
  authorAvatar,
  createdAt,
  slug,
  authorId,
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await apiClient.deletePost(id);
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post",
      });
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/edit/${slug}`;
  };
  return (
    <div className="relative">
      {user && user.id === authorId && (
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Link to={`/post/${slug}`}>
        <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full">
        {coverImage && (
          <div className="aspect-video overflow-hidden relative">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
            {category && (
              <Badge className="absolute top-2 right-2" variant="secondary">
                {category}
              </Badge>
            )}
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-2xl font-bold line-clamp-2 hover:text-primary transition-colors flex-1">
              {title}
            </h3>
            {category && !coverImage && (
              <Badge variant="secondary">{category}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3">{excerpt}</p>
        </CardContent>
        <CardFooter className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={authorAvatar} />
            <AvatarFallback>{authorName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
    </div>
  );
}
