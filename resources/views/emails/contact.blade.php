@component('mail::message')
# Neue Kontaktanfrage

**Name:** {{ $name }}

**E-Mail:** {{ $email }}

**Telefon:** {{ $phone ?? 'Nicht angegeben' }}

**Nachricht:**
{{ $message }}

@component('mail::button', ['url' => 'mailto:' . $email])
Antworten
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
