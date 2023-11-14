import * as React from 'react';
import RestrictionForm from '../components/restrictions/restrictionForm.js';
import { Box } from '@mui/material';

export default function TestPage() {
  return (
    <Box>
      <h1>Restrictions</h1>
      <RestrictionForm />
    </Box>
  );
}
