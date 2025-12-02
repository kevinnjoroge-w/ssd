const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('payments').del();
  await knex('policies').del();
  await knex('sessions').del();
  await knex('plans').del();
  await knex('users').del();

  // Insert Plans
  const plans = await knex('plans').insert([
    {
      id: uuidv4(),
      name: 'Basic Health',
      coverage_type: 'basic',
      description: 'Basic health coverage for outpatient services',
      min_premium: 50,
      max_premium: 100,
      max_coverage: 50000,
      coverage_multiplier: 500,
      benefits: {
        outpatient: true,
        hospitalization: false,
        emergency: true,
        consultation: true
      },
      active: true
    },
    {
      id: uuidv4(),
      name: 'Standard Health',
      coverage_type: 'standard',
      description: 'Standard coverage including hospitalization',
      min_premium: 100,
      max_premium: 300,
      max_coverage: 150000,
      coverage_multiplier: 500,
      benefits: {
        outpatient: true,
        hospitalization: true,
        emergency: true,
        consultation: true,
        maternity: false
      },
      active: true
    },
    {
      id: uuidv4(),
      name: 'Comprehensive Health',
      coverage_type: 'comprehensive',
      description: 'Comprehensive coverage with all benefits',
      min_premium: 300,
      max_premium: 500,
      max_coverage: 500000,
      coverage_multiplier: 500,
      benefits: {
        outpatient: true,
        hospitalization: true,
        emergency: true,
        consultation: true,
        maternity: true,
        dental: true,
        vision: true
      },
      active: true
    }
  ]);

  // Insert Sample Users
  await knex('users').insert([
    {
      id: uuidv4(),
      phone: '+254712345678',
      name: 'John Mwangi',
      email: 'john@example.com',
      occupation: 'Software Engineer',
      income_range: 'high',
      preferred_language: 'en'
    },
    {
      id: uuidv4(),
      phone: '+254722345679',
      name: 'Jane Oduya',
      email: 'jane@example.com',
      occupation: 'Accountant',
      income_range: 'medium',
      preferred_language: 'en'
    }
  ]);
};
