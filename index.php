private function try_proxy_services($order_data) {
    $proxy_url = 'https://your-vercel-app.vercel.app/api/proxy'; // Replace with your deployed URL

    $response = wp_remote_post($proxy_url, [
        'body' => json_encode($this->prepare_booking_data($order_data)),
        'headers' => ['Content-Type' => 'application/json'],
        'timeout' => 60,
    ]);

    if (!is_wp_error($response)) {
        $body = wp_remote_retrieve_body($response);
        $awb = $this->extract_awb_from_response($body);

        if ($awb) {
            return ['success' => true, 'awb_number' => $awb, 'method' => 'vercel_proxy'];
        }
    }

    return ['success' => false, 'message' => 'Vercel proxy failed'];
}
