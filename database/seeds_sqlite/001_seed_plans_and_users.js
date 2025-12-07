const { randomUUID } = require('crypto')

exports.seed = async function(knex) {
  // Clear tables
  await knex('payments').del().catch(()=>{})
  await knex('policies').del().catch(()=>{})
  await knex('plans').del().catch(()=>{})
  await knex('users').del().catch(()=>{})

  const plan1 = {
    id: randomUUID(),
    name: 'Basic Health',
    coverage_type: 'basic',
    description: 'Basic health coverage for outpatient services',
    min_premium: 50,
    max_premium: 100,
    max_coverage: 50000,
    coverage_multiplier: 500,
    benefits: JSON.stringify({ outpatient: true, hospitalization: false, emergency: true, consultation: true }),
    active: true
  }

  const plan2 = {
    id: randomUUID(),
    name: 'Standard Health',
    coverage_type: 'standard',
    description: 'Standard health coverage with hospitalization',
    min_premium: 100,
    max_premium: 300,
    max_coverage: 150000,
    coverage_multiplier: 500,
    benefits: JSON.stringify({ outpatient: true, hospitalization: true, emergency: true, consultation: true, maternity: false }),
    active: true
  }

  const user1 = {
    id: randomUUID(),
    phone: '+254712345678',
    name: 'Test User',
    email: 'test@example.com',
    occupation: 'Engineer',
    income_range: 'high',
    preferred_language: 'en'
  }

  await knex('plans').insert([plan1, plan2])
  await knex('users').insert([user1])
}
