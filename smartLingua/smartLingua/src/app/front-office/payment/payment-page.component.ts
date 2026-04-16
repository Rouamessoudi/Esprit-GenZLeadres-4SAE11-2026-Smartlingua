import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="payment-shell">
      <div class="payment-card">
        <h1>Paiement</h1>
        <p class="subtitle">Finalisez votre abonnement en toute securite.</p>

        <div class="block">
          <p class="block-title">Course Selection</p>
          <div class="course-row">
            <div class="thumb"></div>
            <div class="course-meta">
              <p class="course-name">A2 English Course</p>
              <p class="course-desc">Improve your English with practical, immersive lessons.</p>
            </div>
            <p class="price">$99</p>
          </div>
        </div>

        <div class="block">
          <p class="block-title">Payment Information</p>
          <div class="field">
            <label>Card Number</label>
            <input type="text" placeholder="1234 5678 9876 5432" />
          </div>
          <div class="inline">
            <div class="field">
              <label>MM / YY</label>
              <input type="text" placeholder="09/29" />
            </div>
            <div class="field">
              <label>CVC</label>
              <input type="text" placeholder="***" />
            </div>
          </div>
          <label class="save-line">
            <input type="checkbox" />
            Save card for future purchases
          </label>
          <div class="logos">
            <span>VISA</span><span>MC</span><span>AMEX</span><span>PAY</span>
          </div>
        </div>

        <div class="block">
          <p class="block-title">Billing Information</p>
          <div class="field">
            <label>Full Name</label>
            <input type="text" placeholder="John Doe" />
          </div>
          <div class="field">
            <label>Email Address</label>
            <input type="email" placeholder="john.doe@email.com" />
          </div>
          <div class="field">
            <label>Phone Number</label>
            <input type="text" placeholder="+1 555 000 0000" />
          </div>
        </div>

        <button type="button" class="pay-btn">Pay $99</button>
        <p class="secure">Secure payment via SSL encryption</p>
      </div>
    </section>
  `,
  styles: [`
    .payment-shell {
      min-height: calc(100vh - 140px);
      display: grid;
      place-items: center;
      padding: 2rem 1rem 3rem;
      background: #f8f8fc;
    }
    .payment-card {
      width: min(680px, 100%);
      background: #fff;
      border: 1px solid #ece7df;
      border-radius: 18px;
      padding: 1.35rem;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.07);
    }
    h1 {
      margin: 0;
      font-size: 1.25rem;
      color: #2f2f2f;
    }
    .subtitle {
      margin: 0.35rem 0 1rem;
      color: #797979;
      font-size: 0.92rem;
    }
    .block {
      border: 1px solid #efe8de;
      border-radius: 12px;
      padding: 0.9rem;
      margin-bottom: 0.8rem;
      background: #fffdfa;
    }
    .block-title {
      margin: 0 0 0.7rem;
      font-size: 0.8rem;
      color: #7b6f62;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .course-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .thumb {
      width: 64px;
      height: 44px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6d7cff, #8f9aff);
      flex: 0 0 auto;
    }
    .course-meta { flex: 1; min-width: 0; }
    .course-name {
      margin: 0 0 0.2rem;
      font-weight: 700;
      color: #2f2f2f;
      font-size: 0.95rem;
    }
    .course-desc {
      margin: 0;
      color: #8b8b8b;
      font-size: 0.78rem;
    }
    .price {
      margin: 0;
      font-weight: 800;
      color: #2f2f2f;
    }
    .field { margin-bottom: 0.6rem; }
    label {
      display: block;
      margin-bottom: 0.25rem;
      color: #7b6f62;
      font-size: 0.78rem;
      font-weight: 600;
    }
    input {
      width: 100%;
      border: 1px solid #e8dfd3;
      border-radius: 8px;
      padding: 0.58rem 0.7rem;
      outline: none;
      font-size: 0.9rem;
      background: #fff;
    }
    input:focus {
      border-color: #ceb084;
      box-shadow: 0 0 0 2px rgba(206, 176, 132, 0.14);
    }
    .inline {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
    }
    .save-line {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin: 0.5rem 0 0.45rem;
      font-weight: 500;
      font-size: 0.8rem;
      color: #73695f;
    }
    .save-line input {
      width: auto;
      margin: 0;
    }
    .logos {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .logos span {
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
      border-radius: 5px;
      background: #f2f2f7;
      color: #505050;
      font-weight: 700;
    }
    .pay-btn {
      width: 100%;
      margin-top: 0.3rem;
      border: 0;
      border-radius: 10px;
      padding: 0.8rem 1rem;
      font-weight: 700;
      font-size: 1rem;
      color: #fff;
      cursor: pointer;
      background: linear-gradient(180deg, #d8bc8f 0%, #be965f 100%);
    }
    .secure {
      text-align: center;
      margin: 0.65rem 0 0;
      color: #8a8a8a;
      font-size: 0.78rem;
    }
    @media (max-width: 560px) {
      .inline { grid-template-columns: 1fr; }
      .course-row { align-items: flex-start; }
    }
  `]
})
export class PaymentPageComponent {}
