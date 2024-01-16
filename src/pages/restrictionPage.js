import React from 'react';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import { useState, useEffect } from 'react';
import RestrictionTable2 from '../components/restrictions/restrictionTable2';
import RestrictionForm from '../components/restrictions/restrictionForm';
import AddButton from '../components/shared/addButton';

export default function RestrictionPage({ thisTenant, tenantValues }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);

  const changeData = (newData) => {
    console.log('newData reçue de restrictionForm :', newData);
    setData(newData);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8085/v1/restrictions/', {
        headers: { Accept: 'application/json' }
      });
      setData(response.data);
      console.log(response);
    } catch (error) {
      console.error('Erreur lors de la requête GET :', error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const addRestriction = async (name, target_name, target_id, dataPayload) => {
    try {
      const response = await axios.post(
        `http://localhost:8085/v1/restrictions/?target_name=${target_name}&target_id=${target_id}`,
        {
          name: name,
          data: JSON.stringify(dataPayload)
        },
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      fetchData();
      console.log('thisTenant = ', thisTenant);
      console.log('tenantValues = ', tenantValues);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'ajout de la restriction :", error);
      throw error.response;
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid>
        <Grid item xs={12}>
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <RestrictionTable2 data={data} setNewData={changeData} />
            </Grid>
          </Grid>
        </Grid>
        <AddButton
          pageType={
            <RestrictionForm
              onClose={() => setOpen(false)}
              onAddRestriction={addRestriction}
              thisTenant={thisTenant}
              tenantValues={tenantValues}
            />
          }
          setOpen={setOpen}
          status={open}
          graphqlErrors={null}
        ></AddButton>
      </Grid>
    </Grid>
  );
}
