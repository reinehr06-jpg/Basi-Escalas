<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use App\Support\OrganizationContext;
use Illuminate\Foundation\Console\ServeCommand;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(OrganizationContext::class);
    }

    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        $this->passEnvironmentToServeCommand();
    }

    /**
     * `php artisan serve` só repassa ao processo do servidor as variáveis que
     * estão nessa lista. Dentro do container isso importa: sem o repasse, o
     * .env montado do host venceria o ambiente do Docker e o Mongo voltaria a
     * ser 127.0.0.1 — que, lá dentro, é o próprio container.
     */
    private function passEnvironmentToServeCommand(): void
    {
        if (! class_exists(ServeCommand::class)) {
            return;
        }

        ServeCommand::$passthroughVariables = array_values(array_unique(array_merge(
            ServeCommand::$passthroughVariables,
            [
                'APP_NAME',
                'APP_DEBUG',
                'APP_URL',
                'APP_TIMEZONE',
                'DB_CONNECTION',
                'MONGODB_URI',
                'MONGODB_DATABASE',
                'FRONTEND_URL',
                'SANCTUM_STATEFUL_DOMAINS',
            ],
        )));
    }
}
