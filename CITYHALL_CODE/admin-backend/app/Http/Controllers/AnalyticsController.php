<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AnalyticsController extends Controller
{
    /**
     * Query the Application Insights API.
     */
    public function query(Request $request)
    {
        $appId = env('APPINSIGHTS_APP_ID');
        $apiKey = env('APPINSIGHTS_API_KEY');

        if (!$appId || !$apiKey) {
            Log::error('Application Insights App ID or API Key is not configured.');
            return response()->json(['error' => 'Analytics service is not configured on the server.'], 500);
        }

        // Kusto Query from the frontend
        $kustoQuery = $request->input('query');

        if (!$kustoQuery) {
            return response()->json(['error' => 'A query parameter is required.'], 400);
        }

        $response = Http::withHeaders([
            'x-api-key' => $apiKey,
            'Content-Type' => 'application/json'
        ])->post("https://api.applicationinsights.io/v1/apps/{$appId}/query", [
            'query' => $kustoQuery
        ]);

        if ($response->failed()) {
            Log::error('Application Insights API query failed.', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return response()->json(['error' => 'Failed to retrieve analytics data.'], $response->status());
        }

        return $response->json();
    }

    /**
     * Proxy Matomo analytics data to the frontend to avoid CORS issues.
     */
    public function getMatomoData(Request $request)
    {
        $matomoUrl = env('MATOMO_URL', 'http://localhost/matomo');
        $matomoToken = env('MATOMO_TOKEN', 'a5b8c7c4c08e277f16a3ae7f404788cc');

        $siteId = $request->query('siteId');
        $period = $request->query('period');
        $date = $request->query('date');

        if (!$siteId || !$period || !$date) {
            return response()->json(['error' => 'Missing required parameters.'], 400);
        }

        $url = "$matomoUrl/?module=API&method=VisitsSummary.getUniqueVisitors&idSite=$siteId&period=$period&date=$date&format=JSON&token_auth=$matomoToken";

        try {
            $response = Http::timeout(10)->get($url);
            if ($response->failed()) {
                Log::error('Matomo API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json(['error' => 'Failed to fetch analytics from Matomo.'], $response->status());
            }
            return response()->json($response->json());
        } catch (\Exception $e) {
            Log::error('Matomo API exception', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Exception occurred while fetching analytics.'], 500);
        }
    }
}
