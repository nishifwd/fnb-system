<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_returns_service_status(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()->assertExactJson([
            'status' => 'ok',
            'service' => 'fnb-system',
        ]);
    }
}
