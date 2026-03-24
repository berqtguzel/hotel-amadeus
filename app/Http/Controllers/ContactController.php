<?php

namespace App\Http\Controllers;

use App\Http\Controllers\ContactFormController;
use App\Mail\ContactFormMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function index(string $locale = 'de')
    {
        return Inertia::render('Home/Kontakt', [
            'currentRoute' => 'kontakt',
            'locale'       => $locale,
        ]);
    }

    public function store(Request $request)
    {
        $locale = $request->route('locale') ?? 'de';

        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'message' => 'required|string',
            'phone'   => 'nullable|string|max:50',
            'form_id' => 'nullable|integer',
        ]);

        $formId = (int) ($validated['form_id'] ?? $request->input('formId') ?? 1);

        $successMessage = 'Ihre Nachricht wurde erfolgreich gesendet.';

        try {
            $request->merge(['locale' => $locale]);
            $submitResponse = (new ContactFormController())->submit($request, $formId);

            if (!$submitResponse->isSuccessful()) {
                $data = $submitResponse->getData(true);
                Log::warning('Contact form API hatası (veri kaydedilmiş olabilir)', [
                    'formId'   => $formId,
                    'status'   => $submitResponse->getStatusCode(),
                    'response' => $data,
                ]);
            }

            if (config('dashboard.send_backup_email', true)) {
                try {
                    Mail::to(config('mail.admin_email', 'info@werrapark.de'))
                        ->send(new ContactFormMail($validated));
                } catch (\Throwable $e) {
                    Log::warning('Contact form backup mail hatası', ['error' => $e->getMessage()]);
                }
            }

            Log::info('Contact form gönderildi', ['formId' => $formId, 'email' => $validated['email']]);
            return back()->with('success', $successMessage);
        } catch (\Throwable $e) {
            report($e);
            return back()->with('success', $successMessage);
        }
    }
}
