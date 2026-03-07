import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ExternalLink, Calendar, Building2, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewsDetail() {
  const [, params] = useRoute("/news/:id");
  const newsId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: article, isLoading: articleLoading } = trpc.news.getById.useQuery(
    { id: newsId },
    { enabled: newsId > 0 }
  );

  const { data: aiSummaryData, isLoading: summaryLoading } = trpc.news.getAiSummary.useQuery(
    { id: newsId },
    { enabled: newsId > 0 }
  );

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container max-w-4xl py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container max-w-4xl py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Button>
          </Link>
          <div className="text-center py-16">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Article Not Found</h1>
            <p className="text-gray-500">The news article you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-4xl py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-8 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Daily Brief
          </Button>
        </Link>

        {/* Article Header */}
        <article>
          <header className="mb-8">
            {/* Source and Date */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="font-medium text-primary">{article.source}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-6">
              {article.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Related Stocks */}
              {article.companies && article.companies.length > 0 && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <div className="flex gap-2">
                    {article.companies.map((symbol: string) => (
                      <Link key={symbol} href={`/stock/${symbol}`}>
                        <Badge 
                          variant="outline" 
                          className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 cursor-pointer"
                        >
                          {symbol}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevance Index */}
              <div className="flex items-center gap-2 ml-auto">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Relevance Index:</span>
                <span className="font-semibold text-green-600">{article.relevanceIndex}</span>
              </div>
            </div>
          </header>

          {/* Divider */}
          <hr className="border-gray-200 mb-8" />

          {/* AI Summary Section */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              Summary
            </h2>

            {summaryLoading ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating AI summary...</span>
                </div>
              </div>
            ) : aiSummaryData?.aiSummary ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <div className="prose prose-gray max-w-none">
                  {aiSummaryData.aiSummary.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <p className="text-gray-500">Unable to generate summary. Please try again later.</p>
              </div>
            )}
          </section>

          {/* Key Points Section */}
          {article.keyPoints && article.keyPoints.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Key Points
              </h2>
              <ul className="space-y-3">
                {article.keyPoints.map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700">{point.replace(/^[•\-]\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Original Article Link */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Read the full article</h3>
                <p className="text-sm text-gray-400">View the original source at {article.source}</p>
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <span>View Original</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
