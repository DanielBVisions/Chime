export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-enquire-form]');
  const status = document.querySelector<HTMLElement>('[data-enquire-status]');
  if (!form || !status) return;

  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    submitBtn?.setAttribute('disabled', 'true');
    status.hidden = false;

    try {
      // TODO: confirm the real endpoint that processes /contact submissions
      // (tech spec §8, item 3). Until that's wired up this 404s and we fall
      // through to the console-logged stub below.
      const response = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Unexpected response: ${response.status}`);
      status.textContent = 'Success! We received your email.';
      form.reset();
    } catch {
      console.log('Enquiry submission (stubbed, no live endpoint yet):', data);
      status.textContent = 'Error! Please try again later.';
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });
}
